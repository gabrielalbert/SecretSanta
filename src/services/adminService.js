//import axios from 'axios';
import api from './api';

//const API_URL = import.meta.env?.VITE_API_URL || 'https://localhost:58977/api';

// Admin - User Management
export const getAllUsers = async () => {
  const response = await api.get(`/admin/users`);
  return response.data;
};

export const getUser = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId, updateData) => {
  const response = await api.patch(`/admin/users/${userId}`, updateData);
  return response.data;
};

// Admin - Event Management
export const getAllEvents = async () => {
  const response = await api.get(`/admin/events`);
  return response.data;
};

export const getEvent = async (eventId) => {
  const response = await api.get(`/admin/events/${eventId}`);
  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await api.post(`/admin/events`, eventData);
  return response.data;
};

export const updateEvent = async (eventId, eventData) => {
  const response = await api.put(`/admin/events/${eventId}`, eventData);
  return response.data;
};

export const updateEventStatus = async (eventId, isActive) => {
  const response = await api.patch(`/admin/events/${eventId}/status`, isActive, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

export const deleteEvent = async (eventId) => {
  const response = await api.delete(`/admin/events/${eventId}`);
  return response.data;
};

// User - Invitation Management
export const getMyInvitations = async () => {
  const response = await api.get(`/invitations/my-invitations`);
  return response.data;
};

export const getPendingInvitations = async () => {
  const response = await api.get(`/invitations/my-invitations/pending`);
  return response.data;
};

export const getInvitation = async (invitationId) => {
  const response = await api.get(`/invitations/${invitationId}`);
  return response.data;
};

export const respondToInvitation = async (invitationId, accept) => {
  const response = await api.post(`/invitations/${invitationId}/respond`, { accept });
  return response.data;
};
