import fs from "fs";
import path from "path";

async function runTestFile(filePath) {
  console.log(`Running test: ${filePath}`);
  await import(filePath);
}

function findTests(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const absoluteFilePath = path.join(process.cwd(), filePath);
    if (fs.statSync(filePath).isDirectory()) {
      findTests(filePath, fileList);
    } else if (file.endsWith(".test.js")) {
      fileList.push(absoluteFilePath);
    }
  });

  return fileList;
}

async function runAllTests() {
  const testFiles = findTests("./src");
  for (const file of testFiles) {
    await runTestFile(file);
  }
}

runAllTests();
