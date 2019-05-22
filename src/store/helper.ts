import display from './display';
import filter from './filter';
import schedule from './schedule';
import semester from './semester';

export function toJSON<State extends object>(thisArg: State, defaultObj: State): State {
    const result = {} as State;
    for (const key in defaultObj) {
        result[key] = thisArg[key];
    }
    return result;
}

export function saveStatus() {
    const { currentSemester } = semester;
    if (!currentSemester) return;
    localStorage.setItem(
        currentSemester.id,
        JSON.stringify({
            currentSemester,
            display,
            filter,
            schedule
        })
    );
}
