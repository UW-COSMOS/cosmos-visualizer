const modelPriorityList = [
  "trigram_cleaned",
  "bigram_cleaned",
  "default_cleaned",
  "trigram",
  "bigram",
  "default",
  "trigram_lowered_cleaned",
  "bigram_lowered_cleaned",
  "default_lowered_cleaned",
];

type ModelAPIDescription = { name: string; description: String };

function findBestModel(
  models: ModelAPIDescription[],
  possibleModels = modelPriorityList
) {
  for (const model of possibleModels) {
    const res = models.find((d) => d.name == model);
    if (res != null) return res.name;
  }
  return models[0]?.name;
}

function joinWords(model_name: string, words: string[]) {
  if (model_name.includes("trigram") && words.length <= 3)
    return [words.join(" ")];
  if (model_name.includes("bigram") && words.length <= 2)
    return [words.join(" ")];
  return words;
}

export { findBestModel, joinWords };
