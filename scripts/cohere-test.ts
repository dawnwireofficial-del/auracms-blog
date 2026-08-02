import 'dotenv/config';
import { cohereChat } from '../server/ai';
import { synthesizeWithAi } from '../server/amazon-extractor';

async function main() {
  console.log('COHERE_KEY set:', !!process.env.COHERE_API_KEY, process.env.COHERE_API_KEY ? process.env.COHERE_API_KEY.slice(0, 8) + '...' : 'NONE');
  try {
    const t = await cohereChat('Say OK', 'Reply with exactly the word OK.');
    console.log('COHERE basic:', JSON.stringify(t).slice(0, 120));
  } catch (e: any) {
    console.log('COHERE basic ERR:', e.message);
  }
  try {
    const s = await synthesizeWithAi('B09Q3MD8PP', 'Anker Soundcore Life Q20 Wireless Over-Ear Headphones, Hybrid Active Noise Cancelling');
    console.log('SYNTH:', s ? s.title + ' | ' + s.mainCategory + ' | $' + s.currentPrice : 'NULL');
  } catch (e: any) {
    console.log('SYNTH ERR:', e.message);
  }
}
main();
