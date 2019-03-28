import 'mocha';
import { SwaggerConfig } from './../../src/config';
import { MetadataGenerator } from './../../src/metadataGeneration/metadataGenerator';
import { SpecGenerator } from './../../src/swagger/specGenerator';
import { generateSwaggerSpec } from './../../src/module/generate-swagger-spec';

async function generateNest() {
  const compilerOptions = {
    baseUrl: '.',
    paths: {
      '@/*': ['test/nestjs/*']
    }
  };

  const swaggerConfig: SwaggerConfig = require('./../data/swagger.json');
  const metadata = new MetadataGenerator(
    swaggerConfig.entryFile,
    compilerOptions
  ).Generate();

  console.log('metadata:', metadata);

  // const spec = new SpecGenerator(metadata, swaggerConfig).GetSpec()
  // generateSwaggerSpec({
  //   basePath: "/api",
  //   entryFile: swaggerConfig.entryFile,
  //   outputDirectory: "./dist"
  // });
}

describe('Definition generation', async () => {
  await generateNest();
});
