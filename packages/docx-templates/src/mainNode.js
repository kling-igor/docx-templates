// @flow

/* eslint-disable no-param-reassign, no-console */

import path from 'path';
import fs from 'fs-extra';
import { set as timmSet } from 'timm';
import createReportBrowser from './mainBrowser';
import type { UserOptions, UserOptionsInternal, ImagePars } from './types';

const DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
const log: any = DEBUG ? require('./debug').mainStory : null;

// ==========================================
// Main
// ==========================================
const getDefaultOutput = (templatePath: string): string => {
  const { dir, name, ext } = path.parse(templatePath);
  return path.join(dir, `${name}_report${ext}`);
};

const defaultGetImageData = async (imagePars: ImagePars) => {

  console.log('!!!! DEFAULT GET IMAGE')

  const { data, extension } = imagePars;
  if (data) {
    if (!extension) {
      throw new Error(
        'If you return image `data`, make sure you return an extension as well!'
      );
    }
    return { extension, data };
  }
  const { path: imgPath } = imagePars;
  if (!imgPath) throw new Error('Specify either image `path` or `data`');
  if (!fs) throw new Error('Cannot read image from file in the browser');
  const buffer = await fs.readFile(imgPath);
  return { extension: path.extname(imgPath).toLowerCase(), data: buffer };
};

const createReport = async (options: UserOptions, getImageData: Function = defaultGetImageData) => {
  const { template, replaceImages, _probe } = options;
  const output = options.output || getDefaultOutput(template);
  DEBUG && log.debug(`Output file: ${output}`);

  // ---------------------------------------------------------
  // Load template from filesystem
  // ---------------------------------------------------------
  DEBUG && log.debug(`Reading template from disk at ${template}...`);
  const buffer = await fs.readFile(template);
  const newOptions: UserOptionsInternal = (timmSet(
    options,
    'template',
    buffer
  ): any);

  // ---------------------------------------------------------
  // Images provided as path are converted to base64
  // ---------------------------------------------------------
  if (replaceImages && !options.replaceImagesBase64) {
    DEBUG && log.debug('Converting images to base64...');
    const imgDataBase64 = {};
    const imgNames = Object.keys(replaceImages);
    for (let i = 0; i < imgNames.length; i++) {
      const imgName = imgNames[i];
      const imgPath = replaceImages[imgName];
      DEBUG && log.debug(`Reading ${imgPath} from disk...`);
      const imgBuf = await fs.readFile(imgPath);
      imgDataBase64[imgName] = imgBuf.toString('base64');
    }
    newOptions.replaceImagesBase64 = true;
    newOptions.replaceImages = imgDataBase64;
  }

  // ---------------------------------------------------------
  // Parse and fill template (in-memory)
  // ---------------------------------------------------------
  const report = await createReportBrowser(newOptions, getImageData);
  if (_probe != null) return report;

  // ---------------------------------------------------------
  // Write the result on filesystem
  // ---------------------------------------------------------
  DEBUG && log.debug('Writing report to disk...');
  await fs.ensureDir(path.dirname(output));
  await fs.writeFile(output, report);
  return null;
};

// ==========================================
// Public API
// ==========================================
export default createReport;
