/**
 * Interface representing a region entity
 * @interface IRegion
 */
export interface IRegion {
  /** Unique identifier for the region */
  id: string;
  /** Name of the region */
  name: string;
  /** Timestamp when the region was created */
  created_at?: string;
  /** Timestamp when the region was last updated */
  updated_at?: string;
}
