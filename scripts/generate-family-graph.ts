/// <reference types="node" />

import fs from "fs";
import path from "path";

import {
  assignBranches,
  buildGraphFromGedcomText,
  excludeIndividuals,
  filterGraphToBloodRelativesAndSpouses,
} from "@geniius/utils/family-graph";

const rootDir = process.cwd();

const inputPath = path.resolve(
  rootDir,
  "data/Jordan Michel Nisçoise-20260525/Jordan Michel Nisçoise-20260525.ged",
);

const connectOutputPath = path.resolve(
  rootDir,
  "apps/connect/src/features/family-tree/data/family-graph.generated.json",
);

const treeOutputPath = path.resolve(
  rootDir,
  "apps/tree/src/features/family-tree/data/family-graph.generated.json",
);

const connectRootAncestorId = "7398";

const connectBranchRootIds = [
  "731452",
  "732469",
  "7391",
  "732470",
  "732467",
];

const connectExcludedPersonIds = ["731200299"];

function writeJsonFile(outputPath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
}

function main(): void {
  const gedcomText = fs.readFileSync(inputPath, "utf8");

  const fullGraph = buildGraphFromGedcomText(gedcomText);

  const treeGraph = fullGraph;

  const connectGraph = assignBranches(
    excludeIndividuals(
      filterGraphToBloodRelativesAndSpouses(fullGraph, connectRootAncestorId),
      connectExcludedPersonIds,
    ),
    connectBranchRootIds,
  );

  writeJsonFile(treeOutputPath, treeGraph);
  //writeJsonFile(connectOutputPath, connectGraph);

  console.log(
    `Tree : ${Object.keys(treeGraph.people).length} personnes, ${
      Object.keys(treeGraph.families).length
    } familles`,
  );

  console.log(
    `Connect : ${Object.keys(connectGraph.people).length} personnes, ${
      Object.keys(connectGraph.families).length
    } familles`,
  );

  console.log(`Fichier Tree généré : ${treeOutputPath}`);
  //console.log(`Fichier Connect généré : ${connectOutputPath}`);
}

main();