import { Tags } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';

export interface TagsVm {
  tags: Tags[];
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Creates a view model for the topic tags used by the filter and suggestions.
 * @param tagsRequestState Request state holding the tags and status
 * @returns View model with the tags and computed UI state
 */
export function createTagsVm(tagsRequestState: RequestState<Tags[]>): TagsVm {
  const tags = tagsRequestState.data ?? [];
  return {
    tags,
    isLoading: tagsRequestState.loading && tags.length === 0,
    hasError: !!tagsRequestState.error
  };
}
