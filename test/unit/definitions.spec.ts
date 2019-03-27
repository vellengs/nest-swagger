import 'mocha';
import { MetadataGenerator } from '../../src/metadata/metadataGenerator';
import { writeFileSync } from 'fs';
import { SpecGenerator } from './../../src/swagger/generator';
import { SwaggerConfig } from './../../src/swagger/config';

async function generateNest() {
  const compilerOptions = {
    baseUrl: '.',
    paths: {
      '@/*': ['test/nestjs/*']
    }
  };
  const metadata = new MetadataGenerator(
    './test/nestjs/app.module.ts',
    compilerOptions
  ).generate();
  const swaggerConfig: SwaggerConfig = require('./../data/swagger.json');

  new SpecGenerator(metadata, swaggerConfig)
    .generate(swaggerConfig.outputDirectory, swaggerConfig.yaml)
    .then(() => {
      console.info('Generation completed.');
    })
    .catch((err: any) => {
      console.error(`Error generating swagger. ${err}`);
    });

  writeFileSync('swagger.api.json', JSON.stringify(metadata));
}

describe('Definition generation', async () => {
  await generateNest();
});
