import { Request, Response, NextFunction } from "express";
import { ApiResponse, PlayerFilters } from "../types";
import { IPlayerStoreService } from "../services/player/player-store.service";
import { createLogger } from "../utils/logger.utils";

const logger = createLogger("PlayerController");

export class PlayerController {
  constructor(private playerStore: IPlayerStoreService) {}

  /**
   * @openapi
   * /api/v1/players:
   *   get:
   *     tags:
   *       - Players
   *     summary: Liste des joueurs avec filtres
   *     description: |
   *       Récupère une liste de joueurs filtrée par position, club, et autres critères.
   *
   *       **Filtres disponibles :**
   *       - `position`: Filtre par position (GK, DEF, MID, FWD)
   *       - `club`: Filtre par club (nom complet ou abrégé accepté)
   *       - `limit`: Nombre max de résultats (défaut: 50, max: 100)
   *
   *       **Tri :**
   *       Les résultats sont automatiquement triés par score décroissant.
   *
   *       **Performance :**
   *       - Indexation en O(1) pour position et club
   *       - Temps de réponse < 50ms pour la plupart des requêtes
   *     operationId: getPlayers
   *     parameters:
   *       - in: query
   *         name: position
   *         schema:
   *           $ref: '#/components/schemas/Position'
   *         description: Filtre par position
   *         required: false
   *         example: MID
   *       - in: query
   *         name: club
   *         schema:
   *           type: string
   *         description: Filtre par club (accepte synonymes)
   *         required: false
   *         examples:
   *           fullName:
   *             value: Liverpool
   *             summary: Nom complet
   *           nickname:
   *             value: Spurs
   *             summary: Surnom (converti en "Tottenham Hotspur")
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 50
   *         description: Nombre maximum de résultats
   *         required: false
   *     responses:
   *       200:
   *         description: Liste de joueurs
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         count:
   *                           type: integer
   *                           description: Nombre de joueurs retournés
   *                         players:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               name:
   *                                 type: string
   *                               club:
   *                                 type: string
   *                               position:
   *                                 $ref: '#/components/schemas/Position'
   *                               price:
   *                                 type: number
   *                                 format: float
   *                               score:
   *                                 type: number
   *                                 format: float
   *                               pointsPerGame:
   *                                 type: number
   *                                 format: float
   *             examples:
   *               allPlayers:
   *                 summary: Tous les joueurs (top 50)
   *                 value:
   *                   success: true
   *                   data:
   *                     count: 50
   *                     players:
   *                       - name: "Erling Haaland"
   *                         club: "Manchester City"
   *                         position: "FWD"
   *                         price: 15.0
   *                         score: 3.85
   *                         pointsPerGame: 8.2
   *                       - name: "Mohamed Salah"
   *                         club: "Liverpool"
   *                         position: "MID"
   *                         price: 13.0
   *                         score: 3.42
   *                         pointsPerGame: 7.5
   *               byPosition:
   *                 summary: Milieux de terrain
   *                 value:
   *                   success: true
   *                   data:
   *                     count: 50
   *                     players:
   *                       - name: "Mohamed Salah"
   *                         club: "Liverpool"
   *                         position: "MID"
   *                         price: 13.0
   *                         score: 3.42
   *                         pointsPerGame: 7.5
   *               byClub:
   *                 summary: Joueurs d'Arsenal
   *                 value:
   *                   success: true
   *                   data:
   *                     count: 20
   *                     players:
   *                       - name: "Bukayo Saka"
   *                         club: "Arsenal"
   *                         position: "MID"
   *                         price: 10.0
   *                         score: 2.95
   *                         pointsPerGame: 6.8
   *       400:
   *         description: Paramètres invalides
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   *             example:
   *               error: "Validation error"
   *               message: "Invalid position. Must be one of: GK, DEF, MID, FWD"
   *       500:
   *         description: Erreur serveur
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   */
  getPlayers(
    req: Request<{}, {}, {}, PlayerFilters & { limit?: string }>,
    res: Response<ApiResponse>,
    next: NextFunction
  ): void {
    try {
      const { position, club, limit = "50" } = req.query;

      const filters: PlayerFilters = {
        position: position as any,
        club,
      };

      let players = this.playerStore.search(filters);

      players = players
        .sort((a, b) => b.score - a.score)
        .slice(0, parseInt(limit));

      const formatted = players.map((p) => ({
        name: p.playerName,
        club: p.clubName,
        position: p.position,
        price: p.price,
        score: p.score,
        pointsPerGame: p.pointsPerGame,
      }));

      res.json({
        success: true,
        data: {
          count: formatted.length,
          players: formatted,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
