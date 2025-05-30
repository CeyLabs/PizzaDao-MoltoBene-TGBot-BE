/**
 * @fileoverview Service for managing message broadcasting functionality
 * @module broadcast.service
 */

import * as fs from 'fs';
import * as path from 'path';

import { v4 as uuidv4 } from 'uuid';

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { Command, Ctx, On, Update } from 'nestjs-telegraf';
import {
  InlineKeyboardButton,
  InlineQueryResultArticle,
  InputTextMessageContent,
  KeyboardButton,
  Message,
} from 'telegraf/typings/core/types/typegram';

import { CountryService } from '../country/country.service';
import { AccessService } from '../access/access.service';
import { CommonService } from '../common/common.service';
import { EventDetailService } from '../event-detail/event-detail.service';

import {
  IUserAccessInfo,
  IBroadcastSession,
  IPostMessage,
  IBroadcast,
  IBroadcastMessageDetail,
} from './broadcast.type';
import { ICity, ICityForVars } from '../city/city.interface';
import { CityService } from '../city/city.service';
import { ICountry } from '../country/country.interface';
import { IEventDetail } from '../event-detail/event-detail.interface';
import { RegionService } from '../region/region.service';
import { KnexService } from '../knex/knex.service';

/**
 * Service for managing message broadcasting functionality
 * @class BroadcastService
 * @description Handles broadcasting messages to different channels and groups,
 * including message creation, media handling, and access control
 */
@Update()
@Injectable()
export class BroadcastService {
  /** Array of super admin Telegram IDs */
  private readonly SUPER_ADMIN_IDS: string[] = process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(',').map((id) => id.trim())
    : [];

  constructor(
    private readonly accessService: AccessService,
    private readonly eventDetailService: EventDetailService,
    private readonly countryService: CountryService,
    private readonly regionService: RegionService,
    private readonly cityService: CityService,
    private readonly knexService: KnexService,
    @Inject(forwardRef(() => CommonService))
    private readonly commonService: CommonService,
  ) {}

  /**
   * Handles the /broadcast command
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from?.id) {
      await ctx.reply(this.escapeMarkdown('❌ User ID is undefined.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    const accessRole = await this.accessService.getUserAccess(String(ctx.from.id));
    if (!accessRole || !accessRole.role) {
      await ctx.reply(this.escapeMarkdown('❌ You do not have access to broadcast messages.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    await this.showBroadcastMenu(ctx, accessRole.role);
  }

  /**
   * Handles inline query for city/country search
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  @On('inline_query')
  async handleInlineQuery(@Ctx() ctx: Context): Promise<void> {
    const query = ctx.inlineQuery?.query?.trim();
    const userId = ctx.from?.id;
    const offset = parseInt(ctx.inlineQuery?.offset || '0', 10);
    const itemsPerPage = 10;

    if (!userId) {
      ctx.answerInlineQuery([], { cache_time: 1 });
      return;
    }

    const currentSession = this.commonService.getUserState(userId);
    const searchType = currentSession?.searchType || 'city'; // Default to city search

    if (searchType === 'country') {
      // Handle country search
      let allCountries: ICountry[] =
        currentSession?.allCountries && Array.isArray(currentSession.allCountries)
          ? (currentSession.allCountries as ICountry[])
          : [];

      if (allCountries.length <= 0) {
        // Fetch all countries based on user access
        const accessInfo = await this.accessService.getUserAccess(String(userId));
        if (!accessInfo) {
          ctx.answerInlineQuery([], { cache_time: 1 });
          return;
        }

        if (accessInfo.role === 'admin') {
          // Admin can access all countries
          allCountries = accessInfo.country_data.map((access) => ({
            id: access.country_id,
            name: access.country_name,
            region_id: access.region_id,
          }));
        } else if (accessInfo.role === 'underboss') {
          // Underboss can access countries in their regions
          const countryPromises = accessInfo.region_data.map((access) =>
            this.countryService.getCountriesByRegion(access.region_id),
          );
          const countriesArrays = await Promise.all(countryPromises);
          allCountries = countriesArrays.flat();
          // Remove duplicates
          allCountries = allCountries.filter(
            (country, index, self) => index === self.findIndex((c) => c.id === country.id),
          );
        } else if (accessInfo.role === 'caporegime') {
          // Caporegime can only access their assigned countries
          const countryIds = accessInfo.country_data.map((access) => access.country_id);
          const countryPromises = countryIds.map((countryId) =>
            this.countryService.getCountryById(countryId),
          );
          const countries = await Promise.all(countryPromises);
          allCountries = countries.filter((country) => country !== null) as ICountry[];
        }

        const session: { allCountries?: ICountry[]; [key: string]: any } =
          this.commonService.getUserState(userId) || {};
        session.flow = 'broadcast';
        session.allCountries = allCountries;
        session.searchType = 'country';
        this.commonService.setUserState(userId, session);
      }

      // Filter countries - if no query, show all accessible countries
      const filteredCountries: ICountry[] = query
        ? allCountries.filter((country: ICountry) =>
            country.name.toLowerCase().includes(query.toLowerCase()),
          )
        : allCountries;

      // Apply pagination
      const startIndex = offset;
      const endIndex = startIndex + itemsPerPage;
      const paginatedCountries = filteredCountries.slice(startIndex, endIndex);
      const hasMore = endIndex < filteredCountries.length;
      const nextOffset = hasMore ? endIndex.toString() : '';

      // Fetch region names for each paginated country
      const regionNames: string[] = await Promise.all(
        paginatedCountries.map(async (country: ICountry) => {
          try {
            if (country.region_id) {
              const region = await this.regionService.getRegionById(String(country.region_id));
              return region?.name || '';
            }

            const fullCountry = await this.countryService.getCountryById(String(country.id));
            if (fullCountry && fullCountry.region_id) {
              const region = await this.regionService.getRegionById(String(fullCountry.region_id));
              return region?.name || '';
            }

            return '';
          } catch (error) {
            console.error('Error fetching region for country:', country.name, error);
            return '';
          }
        }),
      );

      const results: InlineQueryResultArticle[] = paginatedCountries.map(
        (country: ICountry, idx: number): InlineQueryResultArticle => ({
          type: 'article',
          id: String(country.id) || country.name,
          title: country.name,
          description: regionNames[idx] || 'Select this country',
          thumbnail_url: process.env.EVENT_IMAGE_URL,
          input_message_content: {
            message_text: `You selected *${this.escapeMarkdown(country.name)}*\\.\n\nPlease confirm your selection\\.`,
            parse_mode: 'MarkdownV2',
          } as InputTextMessageContent,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Confirm',
                  callback_data: `confirm_country_${country.id}`,
                },
                {
                  text: '❌ Cancel',
                  callback_data: `cancel`,
                },
              ],
            ],
          },
        }),
      );

      // Save selected country details in session
      const selectedCountry = paginatedCountries.map((country) => ({
        id: String(country.id),
        name: country.name,
      }));

      this.commonService.setUserState(userId, {
        ...this.commonService.getUserState(userId),
        selectedCountry,
      });

      await ctx.answerInlineQuery(results, {
        cache_time: 0,
        next_offset: nextOffset,
      });
      return;
    }

    // Handle city search
    let allCities: ICity[] =
      currentSession?.allCities && Array.isArray(currentSession.allCities)
        ? (currentSession.allCities as ICity[])
        : [];

    if (allCities.length <= 0) {
      // Fetch cities based on user access and role
      const accessInfo = await this.accessService.getUserAccess(String(userId));
      if (!accessInfo) {
        ctx.answerInlineQuery([], { cache_time: 1 });
        return;
      }

      if (accessInfo.role === 'admin') {
        // Admin can access all cities
        allCities = await this.cityService.getAllCities();
      } else if (accessInfo.role === 'underboss') {
        // Underboss can only access cities in their regions
        const cityPromises = accessInfo.region_data.map((access) =>
          this.cityService.getCitiesByRegionId(access.region_id),
        );
        const citiesArrays = await Promise.all(cityPromises);
        const regionCities = citiesArrays.flat();

        // Convert to ICity format
        allCities = regionCities.map((city) => ({
          id: city.id,
          name: city.name,
          group_id: city.group_id,
          telegram_link: city.telegram_link,
          country_id: '', // Will be fetched if needed
        })) as ICity[];
      } else if (accessInfo.role === 'caporegime') {
        // Caporegime can access cities in their countries
        const cityPromises = accessInfo.country_data.map((access) =>
          this.cityService.getCitiesByCountry(access.country_id),
        );
        const citiesArrays = await Promise.all(cityPromises);
        allCities = citiesArrays.flat();
      } else if (accessInfo.role === 'host') {
        // Host can only access their assigned cities
        allCities = accessInfo.city_data.map((city) => ({
          id: city.city_id,
          name: city.city_name,
          group_id: city.group_id,
          telegram_link: city.telegram_link,
          country_id: city.country_id,
        })) as ICity[];
      } else {
        // Fallback for non-array userAccess (single access object)
        allCities = await this.cityService.getAllCities();
      }

      const session: { allCities?: ICity[]; [key: string]: any } =
        this.commonService.getUserState(userId) || {};
      session.flow = 'broadcast';
      session.allCities = allCities;
      this.commonService.setUserState(userId, session);
    }

    // Filter cities - if no query, show all accessible cities
    const filteredCities: ICity[] = query
      ? allCities.filter((city: ICity) => city.name.toLowerCase().includes(query.toLowerCase()))
      : allCities;

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCities = filteredCities.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredCities.length;
    const nextOffset = hasMore ? endIndex.toString() : '';

    // Fetch country names for each paginated city
    const countryNames: string[] = await Promise.all(
      paginatedCities.map(async (city: ICity) => {
        // First try to get country_id from the city object
        if (city.country_id) {
          const country: ICountry | null = await this.countryService.getCountryById(
            city.country_id,
          );
          return country?.name || '';
        }

        // If country_id is not available, try to get it using group_id
        if (city.group_id) {
          const countryName = await this.countryService.getCountryByGroupId(city.group_id);
          return countryName || '';
        }

        return '';
      }),
    );

    const results: InlineQueryResultArticle[] = paginatedCities.map(
      (city: ICity, idx: number): InlineQueryResultArticle => ({
        type: 'article',
        id: city.id || city.name,
        title: city.name,
        description: countryNames[idx] || '',
        thumbnail_url: process.env.EVENT_IMAGE_URL,
        input_message_content: {
          message_text: `You selected *${this.escapeMarkdown(city.name)}*\\.\n\nPlease confirm your selection\\.`,
          parse_mode: 'MarkdownV2',
        } as InputTextMessageContent,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Confirm',
                callback_data: `confirm_city_${city.group_id ? city.group_id.replace(/^-/, '') : 'confirm_city_none'}`,
              },
              {
                text: '❌ Cancel',
                callback_data: `cancel`,
              },
            ],
          ],
        },
      }),
    );

    // Save selected city details in selectedCity array in session
    const selectedCity = paginatedCities.map((city, idx) => ({
      id: city.id || city.name,
      name: city.name,
      country_name: countryNames[idx] || '',
      group_id: city.group_id
        ? city.group_id.startsWith('-')
          ? city.group_id
          : '-' + city.group_id
        : '',
    }));

    this.commonService.setUserState(userId, {
      ...this.commonService.getUserState(userId),
      selectedCity,
    });

    await ctx.answerInlineQuery(results, {
      cache_time: 0,
      next_offset: nextOffset,
    });
  }

  /**
   * Displays the broadcast menu with available options
   * @param {Context} ctx - The Telegraf context
   * @param {string} role - The user's role
   * @returns {Promise<void>}
   * @private
   */
  private async showBroadcastMenu(ctx: Context, role: string): Promise<void> {
    try {
      const welcomeMessage = `Hello there *${role.charAt(0).toUpperCase() + role.slice(1)}* 👋
Here you can create rich posts, set Variables, and invite new Admins\\.

*You can use the following variables in your broadcast messages:*\n
>\\- \`\\{city\\}\` — City name
>\\- \`\\{country\\}\` — Country name
>\\- \`\\{event\\_name\\}\` — Event name
>\\- \`\\{start\\_date\\}\` — Event start date
>\\- \`\\{end\\_date\\}\` — Event end date
>\\- \`\\{start\\_time\\}\` — Event start time
>\\- \`\\{end\\_time\\}\` — Event end time
>\\- \`\\{timezone\\}\` — Event timezone
>\\- \`\\{location\\}\` — Event location
>\\- \`\\{address\\}\` — Event address
>\\- \`\\{year\\}\` — Event year
>\\- \`\\{unlock\\_link\\}\` — Unlock Protocol link\n

*Example usage:*
Hello \`\\{city\\}\` Pizza DAO members,
We have an upcoming Pizza Day at \`\\{venue\\}\` on \`\\{start_date\\}\` from \`\\{start\\_time\\}\` to \`\\{end\\_time\\}\`\\.

You can register via: \`\\{unlock\\_link\\}\`
`;

      await ctx.reply(welcomeMessage, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📝 Create Post', callback_data: 'create_post' }],
            [
              { text: '⏰ Scheduled Posts', callback_data: 'scheduled_posts' },
              { text: '✏️ Edit Post', callback_data: 'broadcast_edit_post' },
            ],
            [{ text: '⚙️ Settings', callback_data: 'settings' }],
          ],
        },
      });
    } catch (error) {
      console.error('Error displaying broadcast menu:', error);
      await ctx.reply(this.escapeMarkdown('❌ Failed to display post creation interface.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  /**
   * Handles callback queries from inline keyboards
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  async handleCallbackQuery(ctx: Context) {
    const callbackData =
      ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;

    if (!callbackData || !ctx.from?.id) {
      await ctx.answerCbQuery(this.escapeMarkdown('❌ Invalid callback or user ID'));
      return;
    }

    if (callbackData === 'create_post') {
      await this.handleCreatePost(ctx);
      return;
    }

    if (['scheduled_posts', 'broadcast_edit_post', 'settings'].includes(callbackData)) {
      await ctx.reply('This feature is under construction 🚧');
      return;
    }

    if (callbackData.startsWith('broadcast_')) {
      await this.handleBroadcastSelection(ctx, callbackData);
      return;
    }

    if (callbackData.startsWith('confirm_country_')) {
      const countryId = callbackData.replace('confirm_country_', '');
      const session = this.commonService.getUserState(ctx.from.id);
      if (!session) {
        await ctx.answerCbQuery('❌ No active session found\\.');
        return;
      }

      const selectedCountry = session.selectedCountry as Array<{ id?: string; name?: string }>;

      if (!selectedCountry || !Array.isArray(selectedCountry)) {
        await ctx.answerCbQuery(this.escapeMarkdown('❌ Country not found in session.'));
        return;
      }

      // Fetch all cities for this country
      const cities = await this.cityService.getCitiesByCountry(countryId);

      this.commonService.setUserState(ctx.from.id, {
        step: 'creating_post',
        ...session,
        selectedCountry: [
          {
            ...selectedCountry[0],
            cities: cities,
          },
        ],
        targetType: 'country',
        targetId: countryId,
      });

      await ctx.telegram.sendMessage(
        ctx.from.id,
        `📢 You are broadcasting to all cities in *${this.escapeMarkdown(selectedCountry[0]?.name || 'Unknown Country')}*\\.\n\n` +
          `This will send messages to *${cities.length}* cities\\.\n\n` +
          `Send me one or multiple messages you want to include in the post\\. It can be anything — a text, photo, video, even a sticker\\.\n\n` +
          `You can use variables with below format within curly brackets\\.\n\n` +
          `*Eg:*\n` +
          `Hello \`\\{city\\}\` Pizza DAO members in \`\\{country\\}\`,\n` +
          `We have Upcoming Pizza Day on \`\\{location\\}\` at \`\\{start\\_time\\}\`\\.\n\n` +
          `You can register via \\- \`\\{unlock\\_link\\}\``,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        },
      );
      return;
    }

    if (callbackData.startsWith('confirm_city_')) {
      const session = this.commonService.getUserState(ctx.from.id);
      if (!session) {
        await ctx.answerCbQuery('❌ No active session found\\.');
        return;
      }

      const selectedCity = session.selectedCity as Array<{ name?: string }>;

      if (!selectedCity || !Array.isArray(selectedCity)) {
        await ctx.answerCbQuery(this.escapeMarkdown('❌ City not found in session.'));
        return;
      }

      this.commonService.setUserState(ctx.from.id, {
        step: 'creating_post',
        ...session,
        selectedCity: selectedCity,
      });

      await ctx.telegram.sendMessage(
        ctx.from.id,
        `📢 You are assigned as admin to *Pizza DAO*\\.\n\n` +
          `City Name: *${selectedCity[0]?.name}*\n\n` +
          `Send me one or multiple messages you want to include in the post\\. It can be anything — a text, photo, video, even a sticker\\.\n\n` +
          `You can use variables with below format within curly brackets\\.\n\n` +
          `*Eg:*\n` +
          `Hello \`\\{city\\}\` Pizza DAO members,\n` +
          `We have Upcoming Pizza Day on \`\\{location\\}\` at \`\\{start\\_time\\}\`\\.\n\n` +
          `You can register via \\- \`\\{unlock\\_link\\}\``,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        },
      );
      return;
    }

    if (
      callbackData === 'host_specific_city' ||
      callbackData === 'host_specific_country' ||
      callbackData === 'host_create_post'
    ) {
      const buttonNameMap: Record<string, string> = {
        host_specific_city: 'Specific City',
        host_specific_country: 'Specific Country',
        host_create_post: 'Create post',
      };
      await ctx.answerCbQuery(
        this.escapeMarkdown(`You clicked on ${buttonNameMap[callbackData] || 'Unknown button'}`),
      );
      if (callbackData === 'host_create_post') {
        await this.onCreatePost(ctx);
      }
      return;
    }

    if (callbackData.startsWith('msg_')) {
      await this.handleMessageAction(ctx, callbackData);
      return;
    }

    if (callbackData.startsWith('select_region_')) {
      const regionId = callbackData.split('_')[2];
      await this.handleRegionSelection(ctx, regionId);
      return;
    }

    await ctx.answerCbQuery();
  }

  /**
   * Handles region selection from inline keyboard
   * @param {Context} ctx - The Telegraf context
   * @param {string} regionId - ID of the selected region
   * @returns {Promise<void>}
   * @private
   */
  private async handleRegionSelection(ctx: Context, regionId: string): Promise<void> {
    if (!ctx.from?.id) {
      await ctx.answerCbQuery('User ID not found');
      return;
    }
    // delete the previous message
    await ctx.deleteMessage();
    const userId = ctx.from.id;
    const region = await this.regionService.getRegionById(regionId);
    const regionName = region ? region.name : 'Unknown Region';
    const message = this.escapeMarkdown(
      `You have selected region: ${regionName}. Now, send me the messages to broadcast to all cities in this region.`,
    );
    this.commonService.setUserState(userId, {
      flow: 'broadcast',
      step: 'creating_post',
      messages: [],
      targetType: 'region',
      targetId: regionId,
    });
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: this.getKeyboardMarkup(),
    });
  }

  /**
   * Handles the create post action
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   * @private
   */
  private async handleCreatePost(ctx: Context): Promise<void> {
    const userId = String(ctx.from?.id!);
    const accessInfo = await this.accessService.getUserAccess(userId);
    if (!accessInfo) return;

    await ctx.deleteMessage().catch(() => {});

    let message: string;
    let inline_keyboard: InlineKeyboardButton[][] = [];
    let default_keyboard: KeyboardButton[][] = [];

    switch (accessInfo.role) {
      case 'admin':
        message = `You're assigned as *Super Admin* to all the Pizza DAO chats\\. Select a Specific Group\\(s\\) to send the Broadcast Message\\.`;
        inline_keyboard = [
          [
            { text: '🌍 All City Chats', callback_data: 'broadcast_all_cities' },
            { text: '📍 Specific Region', callback_data: 'broadcast_specific_region' },
          ],
          [
            { text: '🌐 Specific Country', callback_data: 'broadcast_specific_country' },
            { text: '🏙️ Specific City', callback_data: 'broadcast_specific_city' },
          ],
        ];
        break;

      case 'underboss': {
        const regionNames = accessInfo.region_data.map((region) => region.region_name).join(', ');
        message = `You're assigned as *Underboss* to all the *${this.escapeMarkdown(regionNames)}* Pizza DAO chat\\(s\\)\\. Select a Specific Group\\(s\\) to send the Broadcast Message\\.`;
        inline_keyboard = [
          [
            { text: '🏙️ Specific City', callback_data: 'broadcast_underboss_city' },
            { text: '🌐 Specific Country', callback_data: 'broadcast_underboss_country' },
          ],
          [
            {
              text: `All City Chats in ${regionNames} region(s)`,
              callback_data: 'broadcast_all_region_cities',
            },
          ],
        ];
        break;
      }

      case 'host': {
        const citynames = accessInfo.city_data.map((region) => region.city_name).join(', ');

        this.commonService.setUserState(Number(ctx.from?.id), {
          flow: 'broadcast',
          step: `creating_post`,
          messages: [] as IPostMessage[],
        });

        message = `You're assigned as *Host* to *${this.escapeMarkdown(citynames)}* Pizza DAO chat\\(s\\)\\. Select an option below
\nSend me one or multiple messages you want to include in the post\\. It can be anything — a text, photo, video, even a sticker\\.`;
        default_keyboard = this.getKeyboardMarkup().keyboard;
        break;
      }

      case 'caporegime': {
        const countryNames = accessInfo.country_data
          .map((region) => region.country_name)
          .join(', ');
        message = `You're assigned as *Caporegime* to *${this.escapeMarkdown(countryNames)}* Pizza DAO chat\\(s\\)\\. Select a Specific Group\\(s\\) to send the Broadcast Message\\.`;
        inline_keyboard = [
          [
            { text: '🏙️ Specific City', callback_data: 'broadcast_caporegime_city' },
            { text: '🌐 Specific Country', callback_data: 'broadcast_caporegime_country' },
          ],
          [
            {
              text: `All City Chats in ${countryNames}`,
              callback_data: 'broadcast_all_caporegime_cities',
            },
          ],
        ];
        break;
      }

      default:
        await ctx.reply(this.escapeMarkdown('❌ You do not have access to broadcast messages.'), {
          parse_mode: 'MarkdownV2',
        });
        return;
    }

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      ...(inline_keyboard.length > 0
        ? { reply_markup: { inline_keyboard } }
        : default_keyboard.length > 0
          ? {
              reply_markup: {
                keyboard: default_keyboard,
                resize_keyboard: true,
                one_time_keyboard: true,
              },
            }
          : {}),
    });
  }

  /**
   * Handles broadcast selection based on user role and callback data
   * @param {Context} ctx - The Telegraf context
   * @param {string} callbackData - The callback data from the inline keyboard
   * @returns {Promise<void>}
   * @private
   */
  private async handleBroadcastSelection(ctx: Context, callbackData: string): Promise<void> {
    try {
      if (!ctx.from?.id) {
        await ctx.answerCbQuery(this.escapeMarkdown('❌ User ID not found'));
        return;
      }

      const userId = ctx.from.id;

      if (callbackData === 'broadcast_all_cities') {
        this.commonService.setUserState(Number(userId), {
          flow: 'broadcast',
          step: `creating_post`,
          messages: [] as IPostMessage[],
        });

        await ctx.reply(
          `📢 You're assigned as admin to *All Pizza DAO* chats\\.\n\n` +
            `Send me one or multiple messages you want to include in the post\\. It can be anything — a text, photo, video, even a sticker\\.\n\n` +
            `You can use variables with below format within curly brackets\\.\n\n` +
            `*Eg:*\n` +
            `Hello \\{city\\} Pizza DAO members,\n` +
            `We have Upcoming Pizza Day on \\{location\\} at \\{start\\_time\\}\\.\n\n` +
            `You can register via \\- \\{unlock\\_link\\}`,

          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getKeyboardMarkup(),
          },
        );
      } else if (
        callbackData === 'broadcast_specific_country' ||
        callbackData === 'broadcast_underboss_country' ||
        callbackData === 'broadcast_caporegime_country'
      ) {
        // Set search type to country
        this.commonService.setUserState(userId, {
          ...this.commonService.getUserState(userId),
          searchType: 'country',
        });

        await ctx.deleteMessage();
        await ctx.reply(
          `You can use the inline mode to search for a country and send a message to all cities in that country\\.\n\n` +
            `For example, type \`@${this.escapeMarkdown(process.env.BOT_USERNAME || 'MoltoBeneBot')}\` and the country name in the message field\\.`,
          {
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🔍 Search Country',
                    switch_inline_query_current_chat: '',
                  },
                ],
              ],
            },
          },
        );
      } else if (
        callbackData === 'broadcast_specific_city' ||
        callbackData === 'broadcast_underboss_city' ||
        callbackData === 'broadcast_caporegime_city'
      ) {
        // Set search type back to city and clear cached cities to force re-fetch based on user role
        this.commonService.setUserState(userId, {
          ...this.commonService.getUserState(userId),
          searchType: 'city',
          allCities: [], // Clear cached cities
        });

        await ctx.deleteMessage();
        await ctx.reply(
          `You can use the inline mode to search for a city and send a message directly\\.\n\n` +
            `For example, type \`@${this.escapeMarkdown(process.env.BOT_USERNAME || 'MoltoBeneBot')}\` and the city name in the message field\\.`,
          {
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🔍 Search City',
                    switch_inline_query_current_chat: '',
                  },
                ],
              ],
            },
          },
        );
      } else if (callbackData === 'broadcast_specific_region') {
        const regions = await this.regionService.getAllRegions();
        if (regions.length === 0) {
          await ctx.reply('No regions found.');
          return;
        }
        const regionButtons = this.createRegionButtons(regions);
        await ctx.deleteMessage();
        await ctx.reply('Select a region to broadcast to:', {
          reply_markup: { inline_keyboard: regionButtons },
        });
      } else if (callbackData === 'broadcast_all_region_cities') {
        const userAccess = await this.accessService.getUserAccess(String(userId));
        if (!userAccess || !Array.isArray(userAccess)) return;

        const regionId = (userAccess[0] as any).region_id;
        if (!regionId) return;

        this.commonService.setUserState(userId, {
          flow: 'broadcast',
          step: 'creating_post',
          messages: [],
          targetType: 'region',
          targetId: regionId,
        });

        await ctx.deleteMessage();
        await ctx.reply(
          `📢 You're broadcasting to all cities in your region\\.\n\n` +
            `Send me one or multiple messages you want to include in the post\\. It can be anything — a text, photo, video, even a sticker\\.\n\n` +
            `You can use variables with below format within curly brackets\\.\n\n` +
            `*Eg:*\n` +
            `Hello \\{city\\} Pizza DAO members,\n` +
            `We have Upcoming Pizza Day on \\{location\\} at \\{start\\_time\\}\\.\n\n` +
            `You can register via \\- \\{unlock\\_link\\}`,
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getKeyboardMarkup(),
          },
        );
      } else if (callbackData === 'broadcast_all_caporegime_cities') {
        const userAccess = await this.accessService.getUserAccess(String(userId));
        if (!userAccess) return;

        const countryId = (userAccess[0] as any).country_id;
        if (!countryId) return;

        this.commonService.setUserState(userId, {
          flow: 'broadcast',
          step: 'creating_post',
          messages: [],
          targetType: 'country',
          targetId: countryId,
        });

        await ctx.deleteMessage();
        await ctx.reply(
          `📢 You're broadcasting to all cities in your country\\.\n\n` +
            `Send me one or multiple messages you want to include in the post\\. It can be anything — a text, photo, video, even a sticker\\.\n\n` +
            `You can use variables with below format within curly brackets\\.\n\n` +
            `*Eg:*\n` +
            `Hello \\{city\\} Pizza DAO members,\n` +
            `We have Upcoming Pizza Day on \\{location\\} at \\{start\\_time\\}\\.\n\n` +
            `You can register via \\- \\{unlock\\_link\\}`,
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getKeyboardMarkup(),
          },
        );
      }
    } catch (error) {
      console.log(error);
      await ctx.answerCbQuery(this.escapeMarkdown('❌ Error processing your request'));
    }
  }

  /**
   * Gets the keyboard markup for message actions
   * @returns {Object} Keyboard markup configuration
   * @private
   */
  private getKeyboardMarkup(): any /* TODO: fix types */ {
    return {
      keyboard: [
        [{ text: 'Delete All' }, { text: 'Preview' }],
        [{ text: 'Cancel' }, { text: 'Send' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }

  /**
   * Creates region keyboard buttons in a grid layout
   * @param {Array<{id: string, name: string}>} regions - Array of region objects
   * @returns {Array<Array<InlineKeyboardButton>>} Grid of keyboard buttons
   * @private
   */
  private createRegionButtons(regions: { id: string; name: string }[]): InlineKeyboardButton[][] {
    const buttons: InlineKeyboardButton[][] = [];
    for (let i = 0; i < regions.length; i += 2) {
      const row: InlineKeyboardButton[] = [
        { text: regions[i].name, callback_data: `select_region_${regions[i].id}` },
      ];
      if (i + 1 < regions.length) {
        row.push({
          text: regions[i + 1].name,
          callback_data: `select_region_${regions[i + 1].id}`,
        });
      }
      buttons.push(row);
    }
    return buttons;
  }

  /**
   * Handles message actions based on callback data
   * @param {Context} ctx - The Telegraf context
   * @param {string} callbackData - The callback data from the inline keyboard
   * @returns {Promise<void>}
   * @private
   */
  private async handleMessageAction(ctx: Context, callbackData: string): Promise<void> {
    if (!ctx.from?.id) {
      await ctx.answerCbQuery(this.escapeMarkdown('❌ User ID not found'));
      return;
    }

    const userId = ctx.from.id;
    const session = this.commonService.getUserState(userId);
    if (!session) {
      await ctx.answerCbQuery(this.escapeMarkdown('❌ No active session found.'));
      return;
    }
    session.messages = session.messages || [];

    const [action, messageIndexStr] = callbackData.split('_').slice(1);
    const index = parseInt(messageIndexStr, 10);

    if (isNaN(index) || index < 0 || index >= session.messages.length) {
      await ctx.answerCbQuery(this.escapeMarkdown('❌ Invalid message index'));
      return;
    }

    switch (action) {
      case 'media':
        this.commonService.setUserState(userId, {
          currentAction: 'attach_media',
          currentMessageIndex: index,
        });

        await ctx.reply(this.escapeMarkdown('Send me an image, GIF, or video (up to 5 MB).'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getCancelKeyboard(),
        });
        break;

      case 'url':
        this.commonService.setUserState(userId, {
          currentAction: 'add_url_buttons',
          currentMessageIndex: index,
        });

        await ctx.reply(
          this.escapeMarkdown(
            'Send me a list of URL buttons for the message. Please use this format:\n\n' +
              'Button text 1 - http://www.example.com/ |\n' +
              'Button text 2 - http://www.example2.com/ |\n' +
              'Button text 3 - http://www.example3.com/\n\n' +
              "Choose 'Cancel' to go back to creating the post.",
          ),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getCancelKeyboard(),
          },
        );
        break;

      case 'pin': {
        const selectedMessage = session.messages[index] as IPostMessage;
        selectedMessage.isPinned = !selectedMessage.isPinned;
        this.commonService.setUserState(userId, {
          ...session,
          step: 'creating_post',
          messages: session.messages ?? [],
        });

        await ctx.answerCbQuery(
          this.escapeMarkdown(`Message pin status: ${selectedMessage.isPinned ? 'ON' : 'OFF'}`),
        );

        if (selectedMessage.messageId && ctx.chat?.id) {
          const inlineKeyboard: InlineKeyboardButton[][] = [
            ...selectedMessage.urlButtons.map((btn) => [{ text: btn.text, url: btn.url }]),
            [
              { text: 'Attach Media', callback_data: `msg_media_${index}` },
              { text: 'Add URL Buttons', callback_data: `msg_url_${index}` },
            ],
            [
              {
                text: `Pin the Message: ${selectedMessage.isPinned ? 'ON' : 'OFF'}`,
                callback_data: `msg_pin_${index}`,
              },
            ],
            [{ text: 'Delete Message', callback_data: `msg_delete_${index}` }],
          ];

          await ctx.telegram.editMessageReplyMarkup(
            ctx.chat.id,
            selectedMessage.messageId,
            undefined,
            { inline_keyboard: inlineKeyboard },
          );
        } else {
          await this.displayMessageWithActions(ctx, index, selectedMessage);
        }
        break;
      }

      case 'delete':
        session.messages.splice(index, 1);
        this.commonService.setUserState(userId, session);

        await ctx.answerCbQuery(this.escapeMarkdown('Message deleted'));
        await ctx.deleteMessage().catch(() => {});
        await ctx.reply(this.escapeMarkdown('✅ Message deleted successfully.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        });
        break;
    }
  }

  /**
   * Gets a keyboard markup with a cancel button
   * @returns {Object} Keyboard markup configuration with cancel button
   * @private
   */
  private getCancelKeyboard(): any /* TODO: fix types */ {
    return {
      keyboard: [[{ text: 'Cancel' }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }

  /**
   * Handles post actions such as preview, send, delete all, and cancel
   * @param {Context} ctx - The Telegraf context
   * @param {string} action - The action to perform
   * @returns {Promise<void>}
   * @private
   */
  private async handlePostActions(ctx: Context, action: string): Promise<void> {
    if (!ctx.from?.id) return;

    const userId = ctx.from.id;
    const session = this.commonService.getUserState(userId);
    if (!session || !session.messages) {
      await ctx.reply(this.escapeMarkdown('❌ No messages to process.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    if (session.messages.length === 0 && action !== 'Cancel') {
      await ctx.reply(this.escapeMarkdown('❌ No messages to process.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    switch (action) {
      case 'Preview':
        await this.previewMessages(ctx, session as IBroadcastSession);
        break;

      case 'Send':
        await this.sendMessages(ctx, session as IBroadcastSession);
        break;

      case 'Delete All':
        this.commonService.setUserState(userId, {
          ...session,
          step: 'creating_post',
          messages: [],
        });
        await ctx.reply(this.escapeMarkdown('✅ All messages have been deleted.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        });
        break;

      case 'Cancel':
        this.commonService.clearUserState(userId);
        await ctx.reply(this.escapeMarkdown('✅ Broadcast session cancelled.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: { remove_keyboard: true },
        });
        break;
    }
  }

  /**
   * Previews messages with variables replaced for a test city
   * @param {Context} ctx - The Telegraf context
   * @param {IBroadcastSession} session - The current broadcast session
   * @returns {Promise<void>}
   * @private
   */
  private async previewMessages(ctx: Context, session: IBroadcastSession): Promise<void> {
    try {
      const previewCity = {
        city_name: 'Berlin',
        group_id: '-1001751302723',
        telegram_link: 'https://t.me/+cPd97vNeP6AxMzFi',
      };
      const countryName = 'Germany';

      await ctx.reply(`🔍 *Preview for ${previewCity.city_name}:*`, {
        parse_mode: 'MarkdownV2',
      });

      for (const [index, message] of session.messages.entries()) {
        const processedText = await this.replaceVars(
          message.text ?? '',
          countryName,
          previewCity,
          true,
        );

        const urlButtons: InlineKeyboardButton[][] = message.urlButtons.map((btn) => [
          { text: btn.text, url: btn.url },
        ]);

        const inlineKeyboard: InlineKeyboardButton[][] = [
          ...urlButtons,
          [
            { text: 'Attach Media', callback_data: `msg_media_${index}` },
            { text: 'Add URL Buttons', callback_data: `msg_url_${index}` },
          ],
          [
            {
              text: `Pin the Message: ${message.isPinned ? 'ON' : 'OFF'}`,
              callback_data: `msg_pin_${index}`,
            },
          ],
          [{ text: 'Delete Message', callback_data: `msg_delete_${index}` }],
        ];

        if (message.mediaType && message.mediaUrl) {
          const caption = this.escapeMarkdown(processedText ?? '');
          const replyMarkup = { inline_keyboard: inlineKeyboard };
          let receivedMessage;

          switch (message.mediaType) {
            case 'photo':
              if (!ctx.chat?.id) {
                throw new Error('Chat ID is undefined');
              }
              receivedMessage = await ctx.telegram.sendPhoto(ctx.chat.id, message.mediaUrl, {
                caption,
                parse_mode: 'MarkdownV2',
                reply_markup: replyMarkup,
              });
              break;
            case 'video':
              if (!ctx.chat?.id) {
                throw new Error('Chat ID is undefined');
              }
              receivedMessage = await ctx.telegram.sendVideo(ctx.chat.id, message.mediaUrl, {
                caption,
                parse_mode: 'MarkdownV2',
                reply_markup: replyMarkup,
              });
              break;
            case 'document':
              if (!ctx.chat?.id) {
                throw new Error('Chat ID is undefined');
              }
              receivedMessage = await ctx.telegram.sendDocument(ctx.chat.id, message.mediaUrl, {
                caption,
                parse_mode: 'MarkdownV2',
                reply_markup: replyMarkup,
              });
              break;
            case 'animation':
              receivedMessage = await ctx.telegram.sendAnimation(
                ctx.chat?.id ?? 0,
                message.mediaUrl,
                {
                  caption,
                  parse_mode: 'MarkdownV2',
                  reply_markup: replyMarkup,
                },
              );
              break;
          }
          if (receivedMessage && 'message_id' in receivedMessage) {
            message.messageId = (receivedMessage as { message_id: number }).message_id;
          }
        } else {
          const sentMessage = await ctx.telegram.sendMessage(
            ctx.chat?.id ??
              (() => {
                throw new Error('Chat ID is undefined');
              })(),
            this.escapeMarkdown(processedText ?? ''),
            {
              parse_mode: 'MarkdownV2',
              reply_markup: { inline_keyboard: inlineKeyboard },
            },
          );
          message.messageId = sentMessage.message_id;
        }

        session.messages[index] = message;
        if (ctx.from?.id) {
          this.commonService.setUserState(ctx.from.id, { ...session });
        }
      }

      await ctx.reply(
        `This post will be sent to your city or cities\\. Use the Send button to distribute it\\.\n\nNOTE: This is just a preview using ${this.escapeMarkdown(previewCity.city_name)} as an example city\\. The actual messages will have the appropriate city name for each group\\.`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        },
      );
    } catch {
      await ctx.reply(this.escapeMarkdown('❌ Error generating preview. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  /**
   * Sends messages to all cities in the user's access list
   * @param {Context} ctx - The Telegraf context
   * @param {IBroadcastSession} session - The current broadcast session
   * @returns {Promise<void>}
   * @private
   */
  private async sendMessages(ctx: Context, session: IBroadcastSession): Promise<void> {
    const userId = String(ctx.from?.id!);
    const logs: string[] = [];

    try {
      let cityData: {
        city_name: string;
        group_id?: string | null;
        telegram_link?: string | null;
      }[] = [];

      if (session.targetType === 'country') {
        // Check if we have selectedCountry with cities already fetched
        if (session.selectedCountry && session.selectedCountry.length > 0) {
          const selectedCountry = session.selectedCountry[0];
          if (selectedCountry.cities) {
            // Use cities from selectedCountry if already fetched
            cityData = selectedCountry.cities.map((city) => ({
              city_name: city.name,
              group_id: city.group_id,
              telegram_link: city.telegram_link,
            }));
          } else if (session.targetId) {
            // Fetch cities if not already in selectedCountry
            const cities = await this.cityService.getCitiesByCountry(session.targetId);
            cityData = cities.map((city) => ({
              city_name: city.name,
              group_id: city.group_id,
              telegram_link: city.telegram_link,
            }));
          }
        } else if (session.targetId) {
          // Fetch all cities for the selected country using
          const cities = await this.cityService.getCitiesByCountry(session.targetId);
          cityData = cities.map((city) => ({
            city_name: city.name,
            group_id: city.group_id,
            telegram_link: city.telegram_link,
          }));
        }
      } else if (session.targetType === 'region' && session.targetId) {
        const cities = await this.cityService.getCitiesByRegionId(session.targetId);
        cityData = cities.map((city) => ({
          city_name: city.name,
          group_id: city.group_id,
          telegram_link: city.telegram_link,
        }));
      } else if (session.targetType === 'all') {
        const accessInfo = await this.accessService.getUserAccess(userId);
        if (!accessInfo) return;
        cityData = accessInfo.city_data.map((city) => ({
          city_name: city.city_name,
          group_id: city.group_id,
          telegram_link: city.telegram_link,
        }));
      } else if (session.selectedCity) {
        if (!Array.isArray(session.selectedCity) || session.selectedCity.length === 0) {
          await ctx.reply(this.escapeMarkdown('❌ Invalid selected city data.'), {
            parse_mode: 'MarkdownV2',
          });
          return;
        }

        const city = session.selectedCity[0];
        cityData = [
          {
            city_name: city.name,
            group_id: city.group_id,
            telegram_link: city.telegram_link,
          },
        ];
      } else {
        // Default case: use user's access data
        const accessInfo = await this.accessService.getUserAccess(userId);
        if (!accessInfo) return;

        cityData = accessInfo.city_data.map((city) => ({
          city_name: city.city_name,
          group_id: city.group_id,
          telegram_link: city.telegram_link,
        }));
      }

      // Filter out cities without group_id
      cityData = cityData.filter((city) => city.group_id);

      if (cityData.length === 0) {
        await ctx.reply(this.escapeMarkdown('❌ No cities with valid group IDs found.'), {
          parse_mode: 'MarkdownV2',
        });
        return;
      }

      await ctx.reply(
        this.escapeMarkdown(`🚀 Starting to send messages to ${cityData.length} cities...`),
        {
          parse_mode: 'MarkdownV2',
        },
      );

      let successCount = 0;
      let failureCount = 0;
      let progressMsgId: number | undefined = undefined;
      const logsDir = path.join(__dirname, '../../../logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      for (let i = 0; i < cityData.length; i++) {
        const city = cityData[i];

        // Skip cities without group_id (double-check)
        if (!city.group_id) {
          failureCount++;
          logs.push(`❌ Failed: ${city.city_name} - No group ID`);
          continue;
        }

        const countryName = await this.countryService.getCountryByGroupId(city.group_id);

        for (const message of session.messages) {
          const processedText = await this.replaceVars(message.text ?? '', countryName, city);

          // START
          const broadcastId = uuidv4();

          // Send log file as csv
          const successEntries: string[] = [];
          const failureEntries: string[] = [];

          // Create a single broadcast record outside the city loop
          const mediaType = message.mediaType || 'text';
          const broadcastRecord: IBroadcast = {
            message_type: mediaType,
            message_text: message.text,
            button_detail:
              message.urlButtons.length > 0
                ? JSON.stringify(
                    message.urlButtons.map((btn) => ({
                      text: btn.text,
                      url: btn.url,
                    })),
                  )
                : undefined,
            attachment_detail: message.mediaUrl ? { file_id: message.mediaUrl } : undefined,
            sender_id: ctx.from?.id,
          };

          await this.createBroadcastRecord({
            id: broadcastId,
            ...broadcastRecord,
          });
          // END

          const urlButtons: InlineKeyboardButton[][] = await Promise.all(
            message.urlButtons.map(async (btn) => [
              {
                text: await this.replaceVars(btn.text, countryName, city),
                url: await this.replaceVars(btn.url, countryName, city),
              },
            ]),
          );

          const replyMarkup = urlButtons.length > 0 ? { inline_keyboard: urlButtons } : undefined;

          try {
            let sentMessage: Message;

            if (message.mediaType && message.mediaUrl) {
              switch (message.mediaType) {
                case 'photo':
                  sentMessage = await ctx.telegram.sendPhoto(city.group_id, message.mediaUrl, {
                    caption: this.escapeMarkdown(processedText ?? ''),
                    parse_mode: 'MarkdownV2',
                    reply_markup: replyMarkup,
                  });
                  break;
                case 'video':
                  sentMessage = await ctx.telegram.sendVideo(city.group_id, message.mediaUrl, {
                    caption: this.escapeMarkdown(processedText ?? ''),
                    parse_mode: 'MarkdownV2',
                    reply_markup: replyMarkup,
                  });
                  break;
                case 'document':
                  sentMessage = await ctx.telegram.sendDocument(city.group_id, message.mediaUrl, {
                    caption: this.escapeMarkdown(processedText ?? ''),
                    parse_mode: 'MarkdownV2',
                    reply_markup: replyMarkup,
                  });
                  break;
                case 'animation':
                  sentMessage = await ctx.telegram.sendAnimation(city.group_id, message.mediaUrl, {
                    caption: this.escapeMarkdown((await processedText) ?? ''),
                    parse_mode: 'MarkdownV2',
                    reply_markup: replyMarkup,
                  });
                  break;
                default:
                  sentMessage = await ctx.telegram.sendMessage(
                    city.group_id,
                    this.escapeMarkdown(processedText ?? ''),
                    {
                      parse_mode: 'MarkdownV2',
                      reply_markup: replyMarkup,
                    },
                  );
              }
            } else {
              sentMessage = await ctx.telegram.sendMessage(
                city.group_id,
                this.escapeMarkdown(processedText ?? ''),
                {
                  parse_mode: 'MarkdownV2',
                  reply_markup: replyMarkup,
                },
              );
            }

            if (message.isPinned) {
              try {
                await ctx.telegram.pinChatMessage(city.group_id, sentMessage.message_id ?? 0, {
                  disable_notification: true,
                });
              } catch (error) {
                logs.push(
                  `☑️ Message delivered to ${city.city_name} (${city.group_id}), but pinning failed: ${error}`,
                );
              }
            }

            successCount++;

            // Escape any commas in the city name for CSV format
            const escapedCityName = city.city_name.includes(',')
              ? `"${city.city_name}"`
              : city.city_name;

            // Add to successful entries array
            successEntries.push(`${escapedCityName},${city.group_id || ''},Success`);

            await this.saveMessageDetail(
              broadcastId,
              sentMessage.message_id?.toString(),
              city,
              true,
            );

            logs.push(`✅ Success: ${city.city_name} (${city.group_id})`);
          } catch (error) {
            failureCount++;

            // Escape any commas in the city name for CSV format
            const escapedCityName = city.city_name.includes(',')
              ? `"${city.city_name}"`
              : city.city_name;

            // Add failure entry to CSV with error message
            const errorMsg = String(error).replace(/"/g, '""');
            failureEntries.push(`${escapedCityName},${city.group_id || ''},Failed,"${errorMsg}"`);

            // Save the failure in the message detail
            await this.saveMessageDetail(broadcastId, undefined, city, false);

            logs.push(`❌ Failed: ${city.city_name} (${city.group_id}) - ${error}`);
          }

          let csvContent = 'City Name,Group ID,Status, Reason\n';
          csvContent = `Broadcast ID: ${broadcastId}\n\n` + csvContent;
          csvContent +=
            successEntries.join('\n') +
            (successEntries.length > 0 && failureEntries.length > 0 ? '\n' : '');
          if (failureEntries.length > 0) {
            csvContent += failureEntries.join('\n');
          }

          // Add final newline if there's content
          if (successEntries.length > 0 || failureEntries.length > 0) {
            csvContent += '\n';
          }

          const logFilePath = path.join(logsDir, `broadcast-${broadcastId}-${Date.now()}.csv`);
          fs.writeFileSync(logFilePath, csvContent, 'utf8');
          await ctx.replyWithDocument({
            source: logFilePath,
            filename: `${broadcastId}.csv`,
          });

          try {
            await ctx.telegram.sendDocument(
              process.env.LOG_GROUP_ID ?? '',
              {
                source: logFilePath,
                filename: `${broadcastId}.csv`,
              },
              {
                message_thread_id: Number(process.env.LOG_THREAD_ID) || undefined,
                caption: `*📡 Broadcast ID*: \`${this.escapeMarkdown(broadcastId)}\`\n👨🏻‍💼 *Sent By*: ${this.escapeMarkdown(ctx.from?.first_name ?? 'Unknown')} [${ctx.from?.id}\n *🕒 Sent at*: ${this.escapeMarkdown(new Date().toLocaleString())}]`,
                parse_mode: 'MarkdownV2',
              },
            );
          } catch (error) {
            console.error('Error sending log file to group:', error);
          }

          // clean up the file after sending
          fs.unlinkSync(logFilePath);

          // clear progress message
          progressMsgId = undefined;
        }

        // Progress update every 10 cities or at the end
        if ((i + 1) % 10 === 0 || i === cityData.length - 1) {
          const progressText = this.escapeMarkdown(
            `📊 Progress: ${i + 1}/${cityData.length} cities\n` +
              `✅ Success: ${successCount}\n❌ Failed: ${failureCount}`,
          );
          if (progressMsgId) {
            try {
              await ctx.telegram.editMessageText(
                ctx.chat?.id ?? 0,
                progressMsgId,
                undefined,
                progressText,
                { parse_mode: 'MarkdownV2' },
              );
            } catch {
              // If edit fails (e.g., message deleted), send a new one
              const sent = await ctx.reply(progressText, { parse_mode: 'MarkdownV2' });
              if ('message_id' in sent) {
                progressMsgId = sent.message_id;
              }
            }
          } else {
            const sent = await ctx.reply(progressText, { parse_mode: 'MarkdownV2' });
            if ('message_id' in sent) {
              progressMsgId = sent.message_id;
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await ctx.reply(
        this.escapeMarkdown(
          `✅ Broadcast completed!\n\n` +
            `📊 Summary:\n` +
            `- Successfully sent to ${successCount} cities\n` +
            `- Failed to send to ${failureCount} cities\n\n` +
            `Check the logs for details.`,
        ),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: { remove_keyboard: true },
        },
      );

      const logFilePath = path.join(__dirname, `broadcast-log-${Date.now()}.txt`);
      fs.writeFileSync(logFilePath, logs.join('\n'), 'utf8');
      await ctx.replyWithDocument({ source: logFilePath, filename: 'broadcast-log.txt' });
      fs.unlinkSync(logFilePath);

      if (ctx.from?.id !== undefined) {
        this.commonService.clearUserState(ctx.from?.id);
      }
    } catch (error) {
      console.error('Error in sendMessages:', error);
      await ctx.reply(
        this.escapeMarkdown('❌ Error sending messages. Please check the logs and try again.'),
        {
          parse_mode: 'MarkdownV2',
        },
      );
    }
  }

  /**
   * Handles broadcast messages and processes them based on the current session state
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  async handleBroadcatsMessages(ctx: Context): Promise<void> {
    if (!ctx.from?.id || !ctx.message || !('text' in ctx.message)) return;

    const userId = ctx.from.id;
    const text = ctx.message.text;
    const session = this.commonService.getUserState(userId);

    if (!session || session.step !== 'creating_post') return;

    // Check variable included or not
    const hasVariable = /\{(\w+)\}/.test(text);
    let variableIncluded = false;
    if (hasVariable) {
      variableIncluded = true;
    }

    if (text === 'Cancel') {
      if (session.currentAction) {
        session.currentAction = undefined;
        session.currentMessageIndex = undefined;
        session.step = session.step ?? 'creating_post';
        this.commonService.setUserState(userId, session);
        await ctx.reply(this.escapeMarkdown('✅ Action cancelled.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        });
      } else {
        await this.handlePostActions(ctx, 'Cancel');
      }
      return;
    }

    if (['Delete All', 'Preview', 'Send'].includes(text)) {
      await this.handlePostActions(ctx, text);
      return;
    }

    if (session.currentAction === 'add_url_buttons' && session.currentMessageIndex !== undefined) {
      const buttons = this.parseUrlButtons(text);
      if (
        buttons.length > 0 &&
        typeof session.currentMessageIndex === 'number' &&
        session.currentMessageIndex >= 0 &&
        session.messages &&
        session.currentMessageIndex < session.messages.length
      ) {
        (session.messages[session.currentMessageIndex] as IPostMessage).urlButtons = buttons;
        this.commonService.setUserState(userId, session);

        await ctx.reply(this.escapeMarkdown('✅ URL buttons added to your message.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        });

        if (
          Array.isArray(session.messages) &&
          typeof session.currentMessageIndex === 'number' &&
          session.currentMessageIndex >= 0 &&
          session.currentMessageIndex < session.messages.length
        ) {
          await this.displayMessageWithActions(
            ctx,
            session.currentMessageIndex,
            session.messages[session.currentMessageIndex] as IPostMessage,
          );
        }

        session.currentAction = undefined;
        session.currentMessageIndex = undefined;
        session.step = session.step ?? 'creating_post';
        this.commonService.setUserState(userId, session);
      } else {
        await ctx.reply(
          this.escapeMarkdown('❌ Invalid URL button format or message index. Please try again.'),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getCancelKeyboard(),
          },
        );
      }
      return;
    }

    try {
      const messageObj: IPostMessage = {
        text,
        isPinned: false,
        urlButtons: [],
        mediaUrl: null,
        mediaType: undefined,
        messageId: undefined,
      };

      if (!session.messages) {
        session.messages = [];
      }
      session.messages.push(messageObj);
      this.commonService.setUserState(userId, {
        ...session,
        step: session.step ?? 'creating_post',
      });

      const messageIndex = session.messages.length - 1;
      await this.displayMessageWithActions(ctx, messageIndex, messageObj, variableIncluded);
    } catch {
      await ctx.reply(this.escapeMarkdown('❌ Error processing your message. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  /**
   * Displays a message with action buttons for editing
   * @param {Context} ctx - The Telegraf context
   * @param {number} index - The index of the message in the session
   * @param {IPostMessage} messageObj - The message object to display
   * @param {boolean} [variableIncluded] - Whether the message includes variables
   * @returns {Promise<void>}
   * @private
   */
  private async displayMessageWithActions(
    ctx: Context,
    index: number,
    messageObj: IPostMessage,
    variableIncluded?: boolean,
  ): Promise<void> {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        throw new Error('Chat ID not found');
      }

      if (messageObj.messageId) {
        await ctx.telegram.deleteMessage(chatId, messageObj.messageId).catch(() => {});
      }

      const inlineKeyboard: InlineKeyboardButton[][] = [
        ...messageObj.urlButtons.map((btn) => [{ text: btn.text, url: btn.url }]),
        [
          { text: 'Attach Media', callback_data: `msg_media_${index}` },
          { text: 'Add URL Buttons', callback_data: `msg_url_${index}` },
        ],
        [
          {
            text: `Pin the Message: ${messageObj.isPinned ? 'ON' : 'OFF'}`,
            callback_data: `msg_pin_${index}`,
          },
        ],
        [{ text: 'Delete Message', callback_data: `msg_delete_${index}` }],
      ];

      let sentMessage: Message | null = null;
      if (messageObj.mediaType && messageObj.mediaUrl) {
        const caption = this.escapeMarkdown(messageObj.text ?? '');
        const replyMarkup = { inline_keyboard: inlineKeyboard };

        switch (messageObj.mediaType) {
          case 'photo':
            sentMessage = await ctx.telegram.sendPhoto(chatId, messageObj.mediaUrl, {
              caption,
              parse_mode: 'MarkdownV2',
              reply_markup: replyMarkup,
            });
            break;
          case 'video':
            sentMessage = await ctx.telegram.sendVideo(chatId, messageObj.mediaUrl, {
              caption,
              parse_mode: 'MarkdownV2',
              reply_markup: replyMarkup,
            });
            break;
          case 'document':
            sentMessage = await ctx.telegram.sendDocument(chatId, messageObj.mediaUrl, {
              caption,
              parse_mode: 'MarkdownV2',
              reply_markup: replyMarkup,
            });
            break;
          case 'animation':
            sentMessage = await ctx.telegram.sendAnimation(chatId, messageObj.mediaUrl, {
              caption,
              parse_mode: 'MarkdownV2',
              reply_markup: replyMarkup,
            });
            break;
        }
      } else {
        sentMessage = await ctx.telegram.sendMessage(
          chatId,
          this.escapeMarkdown(messageObj.text ?? ''),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: { inline_keyboard: inlineKeyboard },
          },
        );
      }

      if (sentMessage && 'message_id' in sentMessage) {
        messageObj.messageId = (sentMessage as { message_id: number }).message_id;
      }
      const userId = ctx.from?.id;
      if (userId) {
        const session = this.commonService.getUserState(userId);
        if (session?.messages) {
          session.messages[index] = messageObj;
          this.commonService.setUserState(userId, session);
        }
      }

      await ctx.reply(
        this.escapeMarkdown('Please continue adding messages or use the keyboard options below.'),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        },
      );

      if (variableIncluded) {
        await ctx.reply(
          '🔎 _Variables detected\\! Use "Preview" to see how they’ll be filled in the final broadcast\\._',
          {
            parse_mode: 'MarkdownV2',
          },
        );
      }
    } catch {
      await ctx.reply(this.escapeMarkdown('❌ Error displaying message. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  /**
   * Parses URL buttons from text input
   * @param {string} text - The text containing URL button definitions
   * @returns {Array<{text: string, url: string}>} Array of parsed button objects
   * @private
   */
  private parseUrlButtons(text: string): { text: string; url: string }[] {
    const buttons: { text: string; url: string }[] = [];
    const buttonTexts = text
      .split(/[\n|]+/)
      .map((line) => line.trim())
      .filter((line) => line);

    for (const buttonText of buttonTexts) {
      const match = buttonText.match(/^(.*?)\s*-\s*([^\s|]+)$/i);
      if (match && match.length === 3) {
        const btnText = match[1].trim();
        let rawUrl = match[2].trim();

        if (rawUrl === '{unlock_link}') {
          rawUrl = 'https://app.unlock-protocol.com/event/{slug}';
          buttons.push({ text: btnText, url: rawUrl });
        } else if (/^https?:\/\/.+/i.test(rawUrl)) {
          try {
            new URL(rawUrl);
            buttons.push({ text: btnText, url: rawUrl });
          } catch {
            // Invalid URL, do not add to buttons
          }
        }
      }
    }
    return buttons;
  }

  /**
   * Handles the creation of a new post
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  async onCreatePost(@Ctx() ctx: Context): Promise<void> {
    try {
      await ctx.reply(
        this.escapeMarkdown(
          "📝 Let's create a new post! Please send me the message you want to broadcast.",
        ),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        },
      );
    } catch {
      await ctx.reply(this.escapeMarkdown('❌ Failed to start post creation. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  /**
   * Handles photo messages
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  @On('photo')
  async onPhoto(@Ctx() ctx: Context): Promise<void> {
    await this.handleMedia(ctx, 'photo');
  }

  /**
   * Handles video messages
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  @On('video')
  async onVideo(@Ctx() ctx: Context): Promise<void> {
    await this.handleMedia(ctx, 'video');
  }

  /**
   * Handles document messages
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  @On('document')
  async onDocument(@Ctx() ctx: Context): Promise<void> {
    await this.handleMedia(ctx, 'document');
  }

  /**
   * Handles animation messages
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  @On('animation')
  async onAnimation(@Ctx() ctx: Context): Promise<void> {
    await this.handleMedia(ctx, 'animation');
  }

  /**
   * Handles media messages (photo, video, document, animation)
   * @param {Context} ctx - The Telegraf context
   * @param {('photo'|'video'|'document'|'animation')} mediaType - The type of media being handled
   * @returns {Promise<void>}
   * @private
   */
  private async handleMedia(
    ctx: Context,
    mediaType: 'photo' | 'video' | 'document' | 'animation',
  ): Promise<void> {
    if (!ctx.from?.id) return;

    const userId = ctx.from.id;
    const session = this.commonService.getUserState(userId);
    if (!session || session.step !== 'creating_post') return;

    let fileId: string | undefined;
    let text: string | null = null;

    if (
      mediaType === 'photo' &&
      ctx.message &&
      'photo' in ctx.message &&
      ctx.message.photo.length > 0
    ) {
      fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      if ('caption' in ctx.message && ctx.message.caption) {
        text = ctx.message.caption;
      }
    } else if (mediaType === 'video' && ctx.message && 'video' in ctx.message) {
      fileId = ctx.message.video.file_id;
      if ('caption' in ctx.message && ctx.message.caption) {
        text = ctx.message.caption;
      }
    } else if (mediaType === 'document' && ctx.message && 'document' in ctx.message) {
      fileId = ctx.message.document.file_id;
      if ('caption' in ctx.message && ctx.message.caption) {
        text = ctx.message.caption;
      }
    } else if (mediaType === 'animation' && ctx.message && 'animation' in ctx.message) {
      fileId = ctx.message.animation.file_id;
      if ('caption' in ctx.message && ctx.message.caption) {
        text = ctx.message.caption;
      }
    }

    if (!fileId) {
      await ctx.reply(this.escapeMarkdown('❌ Could not process the media. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    try {
      if (session.currentAction === 'attach_media' && session.currentMessageIndex !== undefined) {
        if (
          typeof session.currentMessageIndex === 'number' &&
          session.currentMessageIndex >= 0 &&
          session.messages &&
          session.currentMessageIndex < session.messages.length
        ) {
          const msg = session.messages[session.currentMessageIndex] as IPostMessage;
          msg.mediaUrl = fileId;
          msg.mediaType = mediaType;
          msg.text = text || msg.text;
        } else {
          await ctx.reply(this.escapeMarkdown('❌ Invalid message index for attaching media.'), {
            parse_mode: 'MarkdownV2',
          });
          return;
        }

        await ctx.reply(
          this.escapeMarkdown(
            `✅ ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} attached to your message.`,
          ),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getKeyboardMarkup(),
          },
        );

        await this.displayMessageWithActions(
          ctx,
          session.currentMessageIndex,
          session.messages[session.currentMessageIndex] as IPostMessage,
        );

        session.currentAction = undefined;
        session.currentMessageIndex = undefined;
        this.commonService.setUserState(userId, session);
      } else {
        const messageObj: IPostMessage = {
          text,
          isPinned: false,
          urlButtons: [],
          mediaUrl: fileId,
          mediaType,
          messageId: undefined,
        };

        if (!session.messages) {
          session.messages = [];
        }
        session.messages.push(messageObj);
        this.commonService.setUserState(userId, session);

        const messageIndex = session.messages.length - 1;
        await ctx.reply(
          this.escapeMarkdown(
            `✅ ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} added to your post.`,
          ),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getKeyboardMarkup(),
          },
        );

        await this.displayMessageWithActions(ctx, messageIndex, messageObj);
      }
    } catch {
      await ctx.reply(this.escapeMarkdown(`❌ Error processing ${mediaType}. Please try again.`), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  private async createBroadcastRecord(broadcast: IBroadcast): Promise<void> {
    await this.knexService.knex<IBroadcast>('broadcast').insert(broadcast);
  }

  /**
   * Escapes special characters in text for MarkdownV2 formatting
   * @param {string} text - The text to escape
   * @returns {string} The escaped text
   * @private
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }

  /**
   * Replaces variables in text with actual values
   * @param {string} text - The text containing variables to replace
   * @param {string|null} country - The country name
   * @param {ICityForVars} city - The city information
   * @param {boolean} [hardcoded=false] - Whether to use hardcoded values for preview
   * @returns {Promise<string>} The text with variables replaced
   * @private
   */
  private async replaceVars(
    text: string,
    country?: string | null,
    city?: ICityForVars,
    hardcoded: boolean = false,
  ): Promise<string> {
    let event: IEventDetail | null;

    if (hardcoded) {
      // Use hardcoded event details for preview
      event = {
        id: 'a591cf21-bec6-4a6d-909e-c89a84430de3',
        group_id: '-1001751302723',
        is_one_person: false,
        image_url: 'https://storage.unlock-protocol.com/9816d29f-e6a7-43c3-96b6-b9f1708fc81c',
        name: 'Berlin Bitcoin Pizza Party ',
        start_date: '2025-05-22',
        end_date: '2025-05-22',
        start_time: '18:00',
        end_time: '21:00',
        timezone: 'Europe/Berlin',
        location: 'Berlin, Germany',
        address: 'Berlin, Germany',
        country: 'Germany',
        unlock_link: `app.unlock-protocol.com/event/berlin-bitcoin-pizza-party-1`,
        year: 2025,
        slug: 'berlin-bitcoin-pizza-party-1',
      };
    } else {
      const currentYear = new Date().getFullYear();
      event = await this.eventDetailService.getEventByYearAndGroupId(
        currentYear,
        city?.group_id ?? '',
      );
    }

    let result = text
      .replace(/{city}/gi, city?.city_name ?? '')
      .replace(/{country}/gi, country ?? '')
      .replace(/{event_name}/gi, event?.name ?? '')
      .replace(/{start_date}/gi, event?.start_date ?? '')
      .replace(/{end_date}/gi, event?.end_date ?? '')
      .replace(/{start_time}/gi, event?.start_time ?? '')
      .replace(/{end_time}/gi, event?.end_time ?? '')
      .replace(/{timezone}/gi, event?.timezone ?? '')
      .replace(/{location}/gi, event?.location ?? '')
      .replace(/{address}/gi, event?.address ?? '')
      .replace(/{year}/gi, event?.year?.toString() ?? '')
      .replace(/\$\{slug\}/gi, event?.slug ?? '')
      .replace(/{slug}/gi, event?.slug ?? '');

    // Handle unlock_link replacement with slug if available
    if (event?.slug) {
      result = result.replace(
        /{unlock_link}/gi,
        `https://app.unlock-protocol.com/event/${event.slug}`,
      );
    } else {
      result = result.replace(/{unlock_link}/gi, event?.unlock_link ?? '');
    }

    return result;
  }

  /**
   * Save broadcast message detail to the database
   * @param {string} broadcastId - The ID of the existing broadcast record
   * @param {Message} sentMessage - The sent Telegram message
   * @param {Object} city - The city the message was sent to
   * @param {boolean} isSent - Whether the message was successfully sent
   * @private
   */
  private async saveMessageDetail(
    broadcastId: string,
    messageId: string | undefined,
    city: { city_name: string; group_id?: string | null },
    isSent: boolean,
  ): Promise<void> {
    try {
      // Insert only the broadcast message detail
      await this.knexService.knex<IBroadcastMessageDetail>('broadcast_message_detail').insert({
        broadcast_id: broadcastId,
        message_id: messageId,
        group_id: city.group_id || '',
        is_sent: isSent,
      });
    } catch (error) {
      console.error(`Error saving broadcast detail: ${error}`);
    }
  }
}
