import { fromEpoch, toEpoch, toShortDateTime } from './utils';

describe('Utils Tests', () => {
  it('Converts To Epoch As Expected', async () => {
    const date = new Date();
    const epoch = toEpoch(date);
    expect(epoch).toEqual(Math.floor(date.getTime() / 1000));
  });
  it('Converts To Epoch With Undefined As Expected', async () => {
    const date: Date = undefined;
    const epoch = toEpoch(date);
    expect(epoch).toBeUndefined();
  });

  it('Converts From Epoch As Expected', async () => {
    const target = new Date();
    const epoch = Math.floor(target.getTime() / 1000);
    const date = fromEpoch(epoch);
    expect(Math.floor(date.getTime() / 1000)).toEqual(epoch);
  });

  it('Converts From Epoch With Undefined As Expected', async () => {
    const epoch: number = undefined;
    const date = fromEpoch(epoch);
    expect(date).toBeUndefined();
  });

  it('Converts To Short Date And Time As Expected', async () => {
    const date = new Date(1999, 2, 3, 4, 5, 6, 789);
    const text = toShortDateTime(date);
    expect(text).toBe('1999-02-03 04:05:06.789');
  });
});
