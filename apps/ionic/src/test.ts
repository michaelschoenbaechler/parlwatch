// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting
} from '@angular/platform-browser/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting()
);

// Import all spec files manually
// NOTE: Automatic discovery with require.context doesn't work in Angular CLI test environment
import './app/shared/services/swissparl.service.spec';
import './app/business/services/business.service.spec';
import './app/app.component.integration.spec';
