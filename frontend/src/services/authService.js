// src/services/authService.js
import { login, register, logout, isAuthenticated, getUser, updateUser } from '../data/mockData';

export const authService = {
  login(email, password) {
    return login(email, password);
  },
  register(name, email, password) {
    return register(name, email, password);
  },
  logout() {
    logout();
  },
  isAuthenticated() {
    return isAuthenticated();
  },
  getUser() {
    return getUser();
  },
  updateUser(updates) {
    return updateUser(updates);
  },
};

export default authService;
