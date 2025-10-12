import { AppConfig } from './types/config.types';
import { createLogger } from './utils/logger.utils';

// Services
import { PlayerLoaderService } from './services/player/player-loader.service';
import { PlayerStoreService } from './services/player/player-store.service';
import { PlayerSearchService } from './services/player/player-search.service';
import { NameNormalizerService } from './services/name/name-normalizer.service';
import { NameCacheService } from './services/name/name-cache.service';
import { NameResolverService } from './services/name/name-resolver.service';
import { FixtureLoaderService } from './services/fixture/fixture-loader.service';
import { FixtureCalculatorService } from './services/fixture/fixture-calculator.service';
import { TeamStatsService } from './services/team/team-stats.service';
import { TeamValidatorService } from './services/team/team-validator.service';
import { TeamParserService } from './services/team/team-parser.service';
import { TransferValidatorService } from './services/transfer/transfer-validator.service';
import { TransferFinderService } from './services/transfer/transfer-finder.service';
import { TransferAnalyzerService } from './services/transfer/transfer-analyzer.service';
import { TransferRecommenderService } from './services/transfer/transfer-recommender.service';
import { OpenAIClientService } from './services/llm/openai-client.service';
import { LLMManagerService } from './services/llm/llm-manager.service';

// Controllers
import { HealthController } from './controllers/health.controller';
import { TeamController } from './controllers/team.controller';
import { TransferController } from './controllers/transfer.controller';
import { PlayerController } from './controllers/player.controller';
import { FixtureController } from './controllers/fixture.controller';

const logger = createLogger('Container');

export class AppContainer {
  // Services
  public readonly services: {
    playerLoader: PlayerLoaderService;
    playerStore: PlayerStoreService;
    playerSearch: PlayerSearchService;
    nameNormalizer: NameNormalizerService;
    nameCache: NameCacheService;
    nameResolver: NameResolverService;
    fixtureLoader: FixtureLoaderService;
    fixtureCalculator: FixtureCalculatorService;
    teamStats: TeamStatsService;
    teamValidator: TeamValidatorService;
    teamParser: TeamParserService;
    transferValidator: TransferValidatorService;
    transferFinder: TransferFinderService;
    transferAnalyzer: TransferAnalyzerService;
    transferRecommender: TransferRecommenderService;
    llmClient?: OpenAIClientService;
    llmManager?: LLMManagerService;
  };

  // Controllers
  public readonly controllers: {
    health: HealthController;
    team: TeamController;
    transfer: TransferController;
    player: PlayerController;
    fixture: FixtureController;
  };

  constructor(private config: AppConfig) {
    logger.info('Initializing application container...');

    // 1. Load data
    logger.info('Loading player data...');
    const playerLoader = new PlayerLoaderService(config.data.csvPath);
    const players = playerLoader.load();
    logger.info(`Loaded ${players.length} players`);

    // 2. Create core services
    logger.info('Initializing core services...');
    const playerStore = new PlayerStoreService(players);
    const playerSearch = new PlayerSearchService(playerStore);
    const nameNormalizer = new NameNormalizerService();
    const nameCache = new NameCacheService();

    // 3. LLM (optional)
    let llmClient: OpenAIClientService | undefined;
    let llmManager: LLMManagerService | undefined;

    if (config.llm.enabled && config.llm.apiKey) {
      logger.info('Initializing LLM services...');
      llmClient = new OpenAIClientService(config.llm);
      llmManager = new LLMManagerService(llmClient);
      logger.info('LLM services initialized ✓');
    } else {
      logger.warn('LLM services disabled');
    }

    // 4. Name resolution
    const nameResolver = new NameResolverService(
      playerStore,
      nameNormalizer,
      nameCache,
      playerSearch,
      llmManager
    );

    // 5. Fixture services
    logger.info('Loading fixture data...');
    const fixtureLoader = new FixtureLoaderService(config.data.fdrPath);
    const fixtureCalculator = new FixtureCalculatorService(fixtureLoader.getFixtures());
    logger.info('Fixture data loaded ✓');

    // 6. Team services
    const teamStats = new TeamStatsService();
    const teamValidator = new TeamValidatorService(config.rules, teamStats);
    const teamParser = new TeamParserService(
      nameResolver,
      playerStore,
      fixtureCalculator,
      teamStats,
      playerSearch
    );

    // 7. Transfer services
    const transferValidator = new TransferValidatorService(config.rules);
    const transferAnalyzer = new TransferAnalyzerService(teamStats);
    const transferFinder = new TransferFinderService(
      playerStore,
      fixtureCalculator,
      transferValidator
    );
    const transferRecommender = new TransferRecommenderService(
      transferFinder,
      transferAnalyzer
    );

    // Store services
    this.services = {
      playerLoader,
      playerStore,
      playerSearch,
      nameNormalizer,
      nameCache,
      nameResolver,
      fixtureLoader,
      fixtureCalculator,
      teamStats,
      teamValidator,
      teamParser,
      transferValidator,
      transferFinder,
      transferAnalyzer,
      transferRecommender,
      llmClient,
      llmManager
    };

    // 8. Initialize controllers
    logger.info('Initializing controllers...');
    this.controllers = {
      health: new HealthController(config, playerStore),
      team: new TeamController(teamParser, teamValidator),
      transfer: new TransferController(teamParser, transferRecommender),
      player: new PlayerController(playerStore),
      fixture: new FixtureController(fixtureCalculator)
    };

    logger.info('Application container initialized successfully ✓');
  }
}