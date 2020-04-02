const isDifferent = (a1: any[], a2: any[]): boolean =>{
  /** Find if two arrays are different */
  if (a1.length == 0 && a2.length == 0) {
    return false;
  }
  return a1 != a2;
}

export {isDifferent}
