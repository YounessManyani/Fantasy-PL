import { Player, Transfer, TransferRecommendation, RecommendOptions } from '../../types';
import { ITransferFinderService } from './transfer-finder.service';
import { ITransferAnalyzerService } from './transfer-analyzer.service';
import { createLogger } from '../../utils/logger.utils';

const logger = createLogger('TransferRecommender');

export interface ITransferRecommenderService {
  recommend(team: Player[], options?: RecommendOptions): TransferRecommendation;
}

export class TransferRecommenderService implements ITransferRecommenderService {
  constructor(
    private finder: ITransferFinderService,
    private analyzer: ITransferAnalyzerService
  ) {}

  recommend(team: Player[], options: RecommendOptions = {}): TransferRecommendation {
    const {
      bank = 0,
      maxTransfers = 1,
      strategy = 'best_gain',
      gameweek
    } = options;

    logger.info('Starting recommendation', {
      teamSize: team.length,
      bank,
      maxTransfers,
      strategy,
      gameweek
    });

    // Find best transfers
    let transfers: Transfer[] = [];

    if (maxTransfers === 1) {
      const single = this.finder.findSingleTransfer(team, bank, gameweek);
      transfers = single ? [single] : [];
    } else if (maxTransfers === 2) {
      transfers = this.finder.findDoubleTransfer(team, bank, gameweek);
    }

    logger.info(`Found ${transfers.length} transfer(s)`);

    // Apply strategy filtering
    if (strategy !== 'best_gain' && transfers.length > 0) {
      transfers = this.applyStrategy(transfers, strategy);
    }

    // Generate analysis
    const impact = this.analyzer.calculateImpact(transfers);
    const explanation = this.analyzer.generateExplanation(transfers);
    const { team: newTeam } = this.analyzer.applyTransfers(team, transfers);
    const comparison = this.analyzer.compareTeams(team, newTeam);

    return {
      success: true,
      transfers,
      impact,
      explanation,
      newTeam,
      comparison
    };
  }

  private applyStrategy(transfers: Transfer[], strategy: string): Transfer[] {
    const ranked = this.analyzer.rankTransfers(transfers);

    switch (strategy) {
      case 'best_value':
        return ranked.byValue.slice(0, transfers.length);

      case 'balanced':
        return transfers.sort((a, b) => {
          const aScore = a.gain * 0.7 - Math.max(0, a.cost) * 0.3;
          const bScore = b.gain * 0.7 - Math.max(0, b.cost) * 0.3;
          return bScore - aScore;
        });

      default:
        return transfers;
    }
  }
}