export const filterFormationTags = (tags: string[]) => {
  return tags.filter((tag: string) => 
    tag.startsWith('Formado:') || 
    tag.startsWith('Graduado:') || 
    tag.startsWith('Pós-graduado:')
  );
};

export const filterInterestTags = (tags: string[]) => {
  return tags.filter((tag: string) => 
    tag.startsWith('Interesse:')
  );
};

export const filterOtherTags = (tags: string[]) => {
  return tags.filter((tag: string) => 
    !tag.startsWith('Formado:') && 
    !tag.startsWith('Graduado:') && 
    !tag.startsWith('Pós-graduado:') && 
    !tag.startsWith('Interesse:')
  );
};

export const formatFormationTag = (tag: string) => {
  return tag.replace(/^(Formado:|Graduado:|Pós-graduado:)\s*/, '');
};

export const formatInterestTag = (tag: string) => {
  return tag.replace('Interesse: ', '');
};