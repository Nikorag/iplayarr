export interface SpyMap {
    [key : string] : jest.SpyInstance
}

export async function withSpies(callback : any){
    var spies : SpyMap = {};
    await callback(spies);
    Object.keys(spies).forEach((k) => spies[k].mockRestore());
}