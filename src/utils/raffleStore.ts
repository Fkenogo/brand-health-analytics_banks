import { getResponses } from '@/utils/storage';
import { CountryCode } from '@/auth/types';

const RAFFLE_KEY = 'bank_insights_raffles';

export interface RaffleWinner {
  id: string;
  responseId: string;
  deviceId: string;
  timestamp: string;
}

export interface RaffleCampaign {
  id: string;
  name: string;
  country: CountryCode;
  startDate: string;
  endDate: string;
  maxWinners: number;
  winners: RaffleWinner[];
  createdAt: string;
}

const readRaffles = (): RaffleCampaign[] => {
  const raw = localStorage.getItem(RAFFLE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const writeRaffles = (raffles: RaffleCampaign[]) => {
  localStorage.setItem(RAFFLE_KEY, JSON.stringify(raffles));
};

export const raffleStore = {
  list: (): RaffleCampaign[] => readRaffles(),
  create: (data: { name: string; country: CountryCode; startDate: string; endDate: string; maxWinners: number }) => {
    const raffle: RaffleCampaign = {
      id: `raffle-${Date.now()}`,
      name: data.name,
      country: data.country,
      startDate: data.startDate,
      endDate: data.endDate,
      maxWinners: data.maxWinners,
      winners: [],
      createdAt: new Date().toISOString(),
    };
    const next = [raffle, ...readRaffles()];
    writeRaffles(next);
    return raffle;
  },
  selectWinners: (raffleId: string) => {
    const raffles = readRaffles();
    const index = raffles.findIndex(r => r.id === raffleId);
    if (index === -1) return;
    const raffle = raffles[index];
    const responses = getResponses().filter(response => {
      const timestamp = new Date(response.timestamp);
      return response.selected_country === raffle.country &&
        timestamp >= new Date(raffle.startDate) &&
        timestamp <= new Date(raffle.endDate) &&
        response._status === 'completed';
    });

    const pool = responses.filter(response => !raffle.winners.some(w => w.responseId === response.response_id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, raffle.maxWinners).map(response => ({
      id: `winner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      responseId: response.response_id,
      deviceId: response.device_id,
      timestamp: new Date().toISOString(),
    }));
    raffles[index] = { ...raffle, winners: [...raffle.winners, ...winners] };
    writeRaffles(raffles);
  },
};
