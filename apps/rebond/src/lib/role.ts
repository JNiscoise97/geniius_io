// nom.ts

export function displayRole(role?: string | null): string {
  const safeRole = role?.trim() || '';
  if(safeRole == null || safeRole == ''){
    return ''
  }
  let label = safeRole;
  if(safeRole == 'époux-père'){
    label = "père de l'époux";
  }
  if(safeRole == 'époux-mère'){
    label = "mère de l'époux";
  }
  if(safeRole == 'époux-tuteur'){
    label = "tuteur de l'époux";
  }
  if(safeRole == 'épouse-père'){
    label = "père de l'épouse";
  }
  if(safeRole == 'épouse-mère'){
    label = "mère de l'épouse";
  }
  if(safeRole == 'épouse-tuteur'){
    label = "tuteur de l'épouse";
  }
  if(safeRole.startsWith('témoin')){
    label = "témoin";
  }

  return label;
}