// src/module/reseacher/reseacher_up.ts
import { compareTwoStrings } from "string-similarity";
// @ts-ignore - natural не имеет типов
import { DiceCoefficient, JaroWinklerDistance } from "natural";
import { Blank } from "@prisma/client";
import { generateSynonymSentences } from "./synonem";
import { Sleep } from "../helper";

const stopWords = new Set([
    'и', 'в', 'на', 'но', 'что', 'как',
    'это', 'с', 'за', 'от', 'по', 'для',
    'все', 'так', 'то', 'он', 'она', 'они',
    'к', 'кто', 'когда', 'где', 'чтобы', 
    'если', 'ли', 'или', 'да', 'нет', 
    'может', 'сейчас', 'у', 'при', 'из',
    'без', 'если', 'также', 'другой', 
    'всё', 'был', 'есть', 'будет', 
    'даже', 'всегда', 'никогда', 'лишь', 
    'только', 'больше', 'меньше', 'как', 
    'свой', 'себя', 'второй', 'первый', 
    'здесь', 'там', 'об', 'насколько', 
    'сначала', 'последний', 'всю', 
    'каждый', 'человек', 'который', 'всего', 
    'вокруг', 'между', 'перед', 'после', 
    'сама', 'теперь', 'нужен', 'такой', 
    'можно', 'было', 'вне', 'вперед', 
    'или', 'чем', 'чтобы', 'мне', 'вам', 
    'ему', 'ей', 'ими', 'поэтому', 'так', 
    'доказать', 'доказывать', 'всё', 
    'какой', 'какая', 'какие', 'заказ', 
    'чуть', 'куда', 'поэтому', 'вот', 
    'оба', 'всевозможный', 'единственный', 
    'мимо', 'через', 'только', 'другое'
]);

// Функция для очистки строки от лишних символов
function cleanString(input: string): string {
    return input.replace(/[^\w\sА-Яа-яЁё]/g, '').trim().toLowerCase();
}

// Функция для преобразования слова в его лемму
function toLemma(word: string): string {
    const nounEndings = [
        { suffix: 'ы', base: word.slice(0, -1) },
        { suffix: 'и', base: word.slice(0, -1) },
        { suffix: 'а', base: word.slice(0, -1) },
        { suffix: 'я', base: word.slice(0, -1) },
        { suffix: 'е', base: word.slice(0, -1) },
        { suffix: 'у', base: word.slice(0, -1) },
        { suffix: 'ом', base: word.slice(0, -2) },
        { suffix: 'ах', base: word.slice(0, -2) },
        { suffix: 'ях', base: word.slice(0, -2) },
        { suffix: 'ой', base: word.slice(0, -2) },
        { suffix: 'и', base: word.slice(0, -2) },
        { suffix: 'ь', base: word.slice(0, -1) },
        { suffix: 'я', base: word.slice(0, -1) },
        { suffix: 'е', base: word.slice(0, -1) },
        { suffix: 'ой', base: word.slice(0, -2) },
        { suffix: 'ами', base: word.slice(0, -3) },
        { suffix: 'ями', base: word.slice(0, -3) }
    ];

    const verbEndings = [
        { suffix: 'ю', infinitive: 'ить' },
        { suffix: 'ешь', infinitive: 'ить' },
        { suffix: 'ет', infinitive: 'ить' },
        { suffix: 'ем', infinitive: 'ить' },
        { suffix: 'ете', infinitive: 'ить' },
        { suffix: 'ют', infinitive: 'ить' },
        { suffix: 'л', infinitive: 'ить' },
        { suffix: 'ла', infinitive: 'ить' },
        { suffix: 'ло', infinitive: 'ить' },
        { suffix: 'ли', infinitive: 'ить' },
        { suffix: 'у', infinitive: 'ить' },
        { suffix: 'ешь', infinitive: 'ить' },
        { suffix: 'ет', infinitive: 'ить' },
        { suffix: 'ем', infinitive: 'ить' },
        { suffix: 'ете', infinitive: 'ить' },
        { suffix: 'ут', infinitive: 'ить' },
        { suffix: 'ет', infinitive: 'еть' },
        { suffix: 'ем', infinitive: 'еть' },
        { suffix: 'ишь', infinitive: 'ить' },
        { suffix: 'ит', infinitive: 'ить' },
        { suffix: 'им', infinitive: 'еть' },
        { suffix: 'ите', infinitive: 'еть' },
        { suffix: 'и', infinitive: 'ить' },
        { suffix: 'и', infinitive: 'ать' },
        { suffix: 'те', infinitive: 'ить' },
        { suffix: 'ли', infinitive: 'ать' }
    ];

    const adjectiveEndings = [
        { suffix: 'ый', base: word.slice(0, -2) },
        { suffix: 'ая', base: word.slice(0, -2) },
        { suffix: 'ое', base: word.slice(0, -2) },
        { suffix: 'ого', base: word.slice(0, -3) },
        { suffix: 'ой', base: word.slice(0, -2) },
        { suffix: 'ого', base: word.slice(0, -2) },
        { suffix: 'ому', base: word.slice(0, -3) },
        { suffix: 'ой', base: word.slice(0, -2) },
        { suffix: 'ому', base: word.slice(0, -2) },
        { suffix: 'ого', base: word.slice(0, -3) },
        { suffix: 'ую', base: word.slice(0, -2) },
        { suffix: 'ое', base: word.slice(0, -2) },
        { suffix: 'ые', base: word.slice(0, -2) },
        { suffix: 'ие', base: word.slice(0, -2) },
        { suffix: 'ых', base: word.slice(0, -2) },
        { suffix: 'ие', base: word.slice(0, -2) },
        { suffix: 'а', base: word.slice(0, -1) },
        { suffix: 'о', base: word.slice(0, -1) },
        { suffix: 'ы', base: word.slice(0, -1) },
        { suffix: 'ей', base: word.slice(0, -3) },
        { suffix: 'ыми', base: word.slice(0, -3) },
    ];

    // Проверяем существительные
    for (const ending of nounEndings) {
        if (word.endsWith(ending.suffix)) {
            return ending.base;
        }
    }

    // Проверяем глаголы
    for (const ending of verbEndings) {
        if (word.endsWith(ending.suffix)) {
            return word.slice(0, -ending.suffix.length) + ending.infinitive;
        }
    }

    // Проверяем прилагательные
    for (const ending of adjectiveEndings) {
        if (word.endsWith(ending.suffix)) {
            return ending.base;
        }
    }
    
    return word;
}

// Функция для обработки слов с учетом склонений
function normalizeWords(text: string): string[] {
    const cleanedText = cleanString(text);
    const words = cleanedText.split(/\s+/);
    const normalizedTerms: Set<string> = new Set();

    words.forEach(word => {
        if (word.length >= 4 && !stopWords.has(word)) {
            normalizedTerms.add(toLemma(word));
        } else if (word.length < 4 && !stopWords.has(word)) {
            normalizedTerms.add(word);
        }
    });

    return Array.from(normalizedTerms);
}

export async function Researcher_Better_Blank_Target(query: string, sentence: Blank): Promise<Match> {
    const normalizedQuery = normalizeWords(query).join(' ');
    const sentencesArray = sentence.text.split('.').map(s => s.trim()).filter(Boolean);
    const generatedSentences = generateSynonymSentences(normalizedQuery);

    const highestScores = await Promise.all(
        generatedSentences.map(async (generatedSentence) => {
            const normalizedGeneratedText = normalizeWords(generatedSentence).join(' ');

            let highestScore = 0;

            await Promise.all(
                sentencesArray.map(async (text) => {
                    const normalizedText = normalizeWords(text).join(' ');
                    
                    const jaroWinklerScore = JaroWinklerDistance(normalizedGeneratedText, normalizedText, {});
                    const cosineScore = compareTwoStrings(normalizedGeneratedText, normalizedText);
                    const diceCoefficient = DiceCoefficient(normalizedGeneratedText, normalizedText);

                    const overallScore = (
                        jaroWinklerScore * 0.2 +
                        cosineScore * 0.2 +
                        diceCoefficient * 0.6
                    );

                    highestScore = Math.max(highestScore, overallScore);
                })
            );

            return highestScore;
        })
    );

    const maxScore = Math.max(...highestScores);

    return {
        id: sentence.id,
        text: sentence.text,
        id_account: sentence.id_account,
        score: maxScore,
    };
}

export interface Match {
    id: number,
    text: string,
    id_account: number,
    score: number
}