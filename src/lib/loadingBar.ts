type Listener = (active: boolean) => void;

let count = 0;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(l => l(count > 0));
}

export const loadingBar = {
  start() { count++; notify(); },
  done()  { count = Math.max(0, count - 1); notify(); },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
