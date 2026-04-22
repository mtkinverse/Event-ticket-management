import { pendingState }   from './pending.js';
import { activeState }    from './active.js';
import { cancelledState } from './cancelled.js';
import { completedState } from './completed.js';
import { AppError }       from '../../utils/errors.js';

const STATE_MAP = {
  pending:   pendingState,
  active:    activeState,
  cancelled: cancelledState,
  completed: completedState,
};

export const transition = (event, action) => {
  const state = STATE_MAP[event.status];
  if (!state || !state[action]) {
    throw new AppError(`Cannot '${action}' an event in '${event.status}' state`, 422);
  }
  return state[action]();
};
