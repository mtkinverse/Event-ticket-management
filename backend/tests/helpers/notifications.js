import { mockChannel } from '../../src/strategies/notification/index.js';

export const mock = mockChannel;

export const findEmail = (predicate) => mockChannel.history.find(predicate);

export const findEmailByType = (typeKeyword) =>
  mockChannel.history.find(m => m.subject.toLowerCase().includes(typeKeyword.toLowerCase()));

export const reset = () => mockChannel.clear();
