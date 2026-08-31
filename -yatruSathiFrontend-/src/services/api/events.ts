/**
 * @deprecated Transitional shim. Import { activityService } from
 * "./activities" instead. Kept so pages still migrating keep compiling.
 */
import { activityService } from './activities';

export const eventService = {
  getEvents: activityService.getActivities,
  getEventById: activityService.getActivityById,
  createEvent: activityService.createActivity,
  updateEvent: activityService.updateActivity,
  deleteEvent: activityService.deleteActivity,
  getFavorites: activityService.getFavorites,
  addFavorite: activityService.addFavorite,
  removeFavorite: activityService.removeFavorite,
  getUsers: activityService.getUsers,
  bookEvent: activityService.bookActivity,
  updateBookingStatus: activityService.updateBookingStatus,
  completeEvent: activityService.completeActivity,
  cancelEvent: activityService.cancelActivity,
  submitReview: activityService.submitReview,
};
