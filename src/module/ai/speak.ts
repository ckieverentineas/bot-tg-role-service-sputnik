import * as readline from 'readline';

export class Bot {
    private vocabulary: Map<string, number>;
    private messageHistory: string[];

    constructor() {
        this.vocabulary = new Map<string, number>();
        this.messageHistory = [];
    }

    public async addMessage(message: string): Promise<void> {
        this.messageHistory.push(message);
        this.updateVocabulary(message);
    }

    private updateVocabulary(message: string): void {
        const words = message.split(/\s+/);
        for (const word of words) {
            const lowerCaseWord = word.toLowerCase();
            const count = this.vocabulary.get(lowerCaseWord) || 0;
            this.vocabulary.set(lowerCaseWord, count + 1);
        }
    }

    public async generateResponse(iterations: number): Promise<string> {
        const responseWords: string[] = [];
        const maxWordCount = 50; // Максимальное количество слов в ответе

        while (responseWords.length < maxWordCount) {
            const word = this.selectWord();
            if (word) {
                responseWords.push(word);
            }

            // Прерываем цикл, если достигли количества итераций
            if (responseWords.length >= iterations) {
                break;
            }
        }

        return this.constructResponse(responseWords);
    }

    private selectWord(): string | null {
        const totalWeight = Array.from(this.vocabulary.values()).reduce((a, b) => a + b, 0);
        const rand = Math.random() * totalWeight;

        let cumulative = 0;
        for (const [word, weight] of this.vocabulary.entries()) {
            cumulative += weight;
            if (rand < cumulative) {
                return word;
            }
        }
        return null;
    }

    private constructResponse(words: string[]): string {
        // Здесь можно добавить более сложную логику обработки, например, проверку на грамматику.
        return words.join(' ');
    }
}

