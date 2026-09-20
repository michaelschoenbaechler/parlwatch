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
import './app/shared/swissparl/swissparl.service.spec';
import './app/shared/store/recent/recent.store.spec';
import './app/shared/models/transcript.model.spec';
import './app/business/services/business.service.spec';
import './app/business/services/business.facade.spec';
import './app/business/services/cantonal-business.service.spec';
import './app/council-member/services/cantonal-member.service.spec';
import './app/votes/services/cantonal-votes.service.spec';
import './app/shared/models/vote-decision.spec';
import './app/votes/store/vote/vote.vm-builder.spec';
import './app/shared/parliament/models/parliament.model.spec';
import './app/shared/open-parl-data/models/open-parl-data.model.spec';
import './app/shared/open-parl-data/services/open-parl-data.service.spec';
import './app/shared/parliament/store/parliament.store.spec';
import './app/shared/parliament/guards/parliament.guards.spec';
import './app/app.component.integration.spec';
