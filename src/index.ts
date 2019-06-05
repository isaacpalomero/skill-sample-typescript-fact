// Alexa Fact Skill - Sample for Beginners
/* eslint no-use-before-define: 0 */
// sets up dependencies
import { Response, SessionEndedRequest } from "ask-sdk-model";
import {
  SkillBuilders,
  RequestInterceptor,
  RequestHandler,
  HandlerInput,
  ErrorHandler as ASKErrorHandler,
} from "ask-sdk-core";
import i18next, * as i18n from "i18next";
import * as sprintf from "i18next-sprintf-postprocessor";
import { RequestAttributes } from "./interfaces";
import { Random } from "./lib/helpers";

// core functionality for fact skill
class GetNewFactHandler implements RequestHandler {
  public canHandle(handlerInput: HandlerInput): boolean {
    const request = handlerInput.requestEnvelope.request;
    // checks request type
    return (
      request.type === "LaunchRequest" ||
      (request.type === "IntentRequest" &&
        request.intent.name === "GetNewFactIntent")
    );
  }
  public handle(handlerInput: HandlerInput): Response {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    // gets a random fact by assigning an array to the variable
    // the random item from the array will be selected by the i18next library
    // the i18next library is set up in the Request Interceptor
    const randomFact = requestAttributes.t(Strings.FACTS);
    // concatenates a standard message with the random fact
    const speakOutput = requestAttributes.t(Strings.GET_FACT_MESSAGE) + randomFact;

    return (
      handlerInput.responseBuilder
        .speak(speakOutput)
        // Uncomment the next line if you want to keep the session open so you can
        // ask for another fact without first re-opening the skill
        // .reprompt(requestAttributes.t('HELP_REPROMPT'))
        .withSimpleCard(requestAttributes.t(Strings.SKILL_NAME), randomFact)
        .getResponse()
    );
  }
}

class HelpHandler implements RequestHandler {
  public canHandle(handlerInput: HandlerInput): boolean {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.HelpIntent"
    );
  }
  public handle(handlerInput: HandlerInput): Response {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t(Strings.HELP_MESSAGE))
      .reprompt(requestAttributes.t(Strings.HELP_REPROMPT))
      .getResponse();
  }
}

class FallbackHandler implements RequestHandler {
  // 2018-Aug-01: AMAZON.FallbackIntent is only currently available in en-* locales.
  //              This handler will not be triggered except in those locales, so it can be
  //              safely deployed for any locale.
  public canHandle(handlerInput: HandlerInput): boolean {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.FallbackIntent"
    );
  }
  public handle(handlerInput: HandlerInput): Response {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t(Strings.FALLBACK_MESSAGE))
      .reprompt(requestAttributes.t(Strings.FALLBACK_REPROMPT))
      .getResponse();
  }
}

class ExitHandler implements RequestHandler {
  public canHandle(handlerInput: HandlerInput): boolean {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      (request.intent.name === "AMAZON.CancelIntent" ||
        request.intent.name === "AMAZON.StopIntent")
    );
  }
  public handle(handlerInput: HandlerInput): Response {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t(Strings.STOP_MESSAGE))
      .getResponse();
  }
}

class SessionEndedRequestHandler implements RequestHandler {
  public canHandle(handlerInput: HandlerInput): boolean {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "SessionEndedRequest";
  }
  public handle(handlerInput: HandlerInput): Response {
    if (handlerInput.requestEnvelope.request.type === "SessionEndedRequest") {
      const request: SessionEndedRequest = handlerInput.requestEnvelope.request;
      console.log(`Session ended with reason: ${request.reason}`);
    }
    return handlerInput.responseBuilder.getResponse();
  }
}

class ErrorHandler implements ASKErrorHandler {
  public canHandle(_handlerInput: HandlerInput): boolean {
    return true;
  }
  public handle(handlerInput: HandlerInput, error: Error): Response {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t(Strings.ERROR_MESSAGE))
      .reprompt(requestAttributes.t(Strings.ERROR_MESSAGE))
      .getResponse();
  }
}

type TranslationFunction = (...args: any[]) => string;

/**
 * Adds translation functions to the RequestAttributes.
 */
export class LocalizationInterceptor implements RequestInterceptor {
  public async process(handlerInput: HandlerInput): Promise<void> {
    const t = await i18n.default.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler:
        sprintf.overloadTranslationOptionHandler,
      resources: languageStrings,
      returnObjects: true,
    });
    const attributes = handlerInput.attributesManager.getRequestAttributes() as RequestAttributes;
    attributes.t = (...args: any[]) => {
      return (t as TranslationFunction)(...args);
    };
    attributes.tr = (key: any) => {
      const result = t(key) as string[];
      return Random(result);
    };
  }
}

const skillBuilder = SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    new GetNewFactHandler(),
    new HelpHandler(),
    new ExitHandler(),
    new FallbackHandler(),
    new SessionEndedRequestHandler()
  )
  .addRequestInterceptors(new LocalizationInterceptor())
  .addErrorHandlers(new ErrorHandler())
  .withCustomUserAgent("sample/basic-fact/v1")
  .lambda();

export enum Strings {
  SKILL_NAME = "SKILL_NAME",
  GET_FACT_MESSAGE = "GET_FACT_MESSAGE",
  HELP_MESSAGE = "HELP_MESSAGE",
  HELP_REPROMPT = "HELP_REPROMPT",
  FALLBACK_MESSAGE = "FALLBACK_MESSAGE",
  FALLBACK_REPROMPT = "FALLBACK_REPROMPT",
  ERROR_MESSAGE = "ERROR_MESSAGE",
  STOP_MESSAGE = "STOP_MESSAGE",
  FACTS = "FACTS",
}
interface IStrings {
  [Strings.SKILL_NAME]: string;
  [Strings.GET_FACT_MESSAGE]: string;
  [Strings.HELP_MESSAGE]: string;
  [Strings.HELP_REPROMPT]: string;
  [Strings.FALLBACK_MESSAGE]: string;
  [Strings.FALLBACK_REPROMPT]: string;
  [Strings.ERROR_MESSAGE]: string;
  [Strings.STOP_MESSAGE]: string;
  [Strings.FACTS]: string[];
}

// translations
const deData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Weltraumwissen",
    GET_FACT_MESSAGE: "Hier sind deine Fakten: ",
    HELP_MESSAGE:
      "Du kannst sagen, „Nenne mir einen Fakt über den Weltraum“, oder du kannst „Beenden“ sagen... Wie kann ich dir helfen?",
    HELP_REPROMPT: "Wie kann ich dir helfen?",
    FALLBACK_MESSAGE:
      "Die Weltraumfakten Skill kann dir dabei nicht helfen. Sie kann dir Fakten über den Raum erzählen, wenn du dannach fragst.",
    FALLBACK_REPROMPT: "Wie kann ich dir helfen?",
    ERROR_MESSAGE: "Es ist ein Fehler aufgetreten.",
    STOP_MESSAGE: "Auf Wiedersehen!",
    FACTS: [
      "Ein Jahr dauert auf dem Merkur nur 88 Tage.",
      "Die Venus ist zwar weiter von der Sonne entfernt, hat aber höhere Temperaturen als Merkur.",
      "Venus dreht sich entgegen dem Uhrzeigersinn, möglicherweise aufgrund eines früheren Zusammenstoßes mit einem Asteroiden.",
      "Auf dem Mars erscheint die Sonne nur halb so groß wie auf der Erde.",
      "Jupiter hat den kürzesten Tag aller Planeten.",
    ],
  } as IStrings,
};

const dedeData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Weltraumwissen auf Deutsch",
  } as IStrings,
};

// TODO: Replace this data with your own."**  This is the data for our skill.  You can see that it is a simple list of facts.

// TODO: The items below this comment need your attention."** This is the beginning of the section where you need to customize several text strings for your skill.

const enData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Space Facts",
    GET_FACT_MESSAGE: "Here's your fact: ",
    HELP_MESSAGE:
      "You can say tell me a space fact, or, you can say exit... What can I help you with?",
    HELP_REPROMPT: "What can I help you with?",
    FALLBACK_MESSAGE:
      "The Space Facts skill can't help you with that.  It can help you discover facts about space if you say tell me a space fact. What can I help you with?",
    FALLBACK_REPROMPT: "What can I help you with?",
    ERROR_MESSAGE: "Sorry, an error occurred.",
    STOP_MESSAGE: "Goodbye!",
    FACTS: [
      "A year on Mercury is just 88 days long.",
      "Despite being farther from the Sun, Venus experiences higher temperatures than Mercury.",
      "On Mars, the Sun appears about half the size as it does on Earth.",
      "Jupiter has the shortest day of all the planets.",
      "The Sun is an almost perfect sphere.",
    ],
  } as IStrings,
};

const enauData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Austrailian Space Facts",
  } as IStrings,
};

const encaData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Canadian Space Facts",
  } as IStrings,
};

const engbData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "British Space Facts",
  } as IStrings,
};

const eninData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Indian Space Facts",
  } as IStrings,
};

const enusData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "American Space Facts",
  } as IStrings,
};

const esData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Curiosidades del Espacio",
    GET_FACT_MESSAGE: "Aquí está tu curiosidad: ",
    HELP_MESSAGE:
      "Puedes decir dime una curiosidad del espacio o puedes decir salir... Cómo te puedo ayudar?",
    HELP_REPROMPT: "Como te puedo ayudar?",
    FALLBACK_MESSAGE:
      "La skill Curiosidades del Espacio no te puede ayudar con eso.  Te puede ayudar a descubrir curiosidades sobre el espacio si dices dime una curiosidad del espacio. Como te puedo ayudar?",
    FALLBACK_REPROMPT: "Como te puedo ayudar?",
    ERROR_MESSAGE: "Lo sentimos, se ha producido un error.",
    STOP_MESSAGE: "Adiós!",
    FACTS: [
      "Un año en Mercurio es de solo 88 días",
      "A pesar de estar más lejos del Sol, Venus tiene temperaturas más altas que Mercurio",
      "En Marte el sol se ve la mitad de grande que en la Tierra",
      "Jupiter tiene el día más corto de todos los planetas",
      "El sol es una esféra casi perfecta",
    ],
  } as IStrings,
};

const esesData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Curiosidades del Espacio para España",
  } as IStrings,
};

const esmxData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Curiosidades del Espacio para México",
  } as IStrings,
};

const frData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Anecdotes de l'Espace",
    GET_FACT_MESSAGE: "Voici votre anecdote : ",
    HELP_MESSAGE:
      "Vous pouvez dire donne-moi une anecdote, ou, vous pouvez dire stop... Comment puis-je vous aider?",
    HELP_REPROMPT: "Comment puis-je vous aider?",
    FALLBACK_MESSAGE:
      "La skill des anecdotes de l'espace ne peux vous aider avec cela. Je peux vous aider à découvrir des anecdotes sur l'espace si vous dites par exemple, donne-moi une anecdote. Comment puis-je vous aider?",
    FALLBACK_REPROMPT: "Comment puis-je vous aider?",
    ERROR_MESSAGE: "Désolé, une erreur est survenue.",
    STOP_MESSAGE: "Au revoir!",
    FACTS: [
      "Une année sur Mercure ne dure que 88 jours.",
      "En dépit de son éloignement du Soleil, Vénus connaît des températures plus élevées que sur Mercure.",
      "Sur Mars, le Soleil apparaît environ deux fois plus petit que sur Terre.",
      "De toutes les planètes, Jupiter a le jour le plus court.",
      "Le Soleil est une sphère presque parfaite.",
    ],
  } as IStrings,
};

const frfrData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Anecdotes françaises de l'espace",
  } as IStrings,
};

const itData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Aneddoti dallo spazio",
    GET_FACT_MESSAGE: "Ecco il tuo aneddoto: ",
    HELP_MESSAGE:
      "Puoi chiedermi un aneddoto dallo spazio o puoi chiudermi dicendo \"esci\"... Come posso aiutarti?",
    HELP_REPROMPT: "Come posso aiutarti?",
    FALLBACK_MESSAGE:
      "Non posso aiutarti con questo. Posso aiutarti a scoprire fatti e aneddoti sullo spazio, basta che mi chiedi di dirti un aneddoto. Come posso aiutarti?",
    FALLBACK_REPROMPT: "Come posso aiutarti?",
    ERROR_MESSAGE: "Spiacenti, si è verificato un errore.",
    STOP_MESSAGE: "A presto!",
    FACTS: [
      "Sul pianeta Mercurio, un anno dura solamente 88 giorni.",
      "Pur essendo più lontana dal Sole, Venere ha temperature più alte di Mercurio.",
      "Su Marte il sole appare grande la metà che su la terra. ",
      "Tra tutti i pianeti del sistema solare, la giornata più corta è su Giove.",
      "Il Sole è quasi una sfera perfetta.",
    ],
  } as IStrings,
};

const ititData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Aneddoti dallo spazio",
  } as IStrings,
};

const jpData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "日本語版豆知識",
    GET_FACT_MESSAGE: "知ってましたか？",
    HELP_MESSAGE:
      "豆知識を聞きたい時は「豆知識」と、終わりたい時は「おしまい」と言ってください。どうしますか？",
    HELP_REPROMPT: "どうしますか？",
    ERROR_MESSAGE: "申し訳ありませんが、エラーが発生しました",
    STOP_MESSAGE: "さようなら",
    FACTS: [
      "水星の一年はたった88日です。",
      "金星は水星と比べて太陽より遠くにありますが、気温は水星よりも高いです。",
      "金星は反時計回りに自転しています。過去に起こった隕石の衝突が原因と言われています。",
      "火星上から見ると、太陽の大きさは地球から見た場合の約半分に見えます。",
      "木星の<sub alias=\"いちにち\">1日</sub>は全惑星の中で一番短いです。",
      "天の川銀河は約50億年後にアンドロメダ星雲と衝突します。",
    ],
  } as IStrings,
};

const jpjpData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "日本語版豆知識",
  } as IStrings,
};

const ptData: i18next.ResourceLanguage = {
  translation: {
    SKILL_NAME: "Fatos Espaciais",
    GET_FACT_MESSAGE: "Aqui vai: ",
    HELP_MESSAGE:
      "Você pode me perguntar por um fato interessante sobre o espaço, ou, fexar a skill. Como posso ajudar?",
    HELP_REPROMPT: "O que vai ser?",
    FALLBACK_MESSAGE:
      "A skill fatos espaciais não tem uma resposta para isso. Ela pode contar informações interessantes sobre o espaço, é só perguntar. Como posso ajudar?",
    FALLBACK_REPROMPT:
      "Eu posso contar fatos sobre o espaço. Como posso ajudar?",
    ERROR_MESSAGE: "Desculpa, algo deu errado.",
    STOP_MESSAGE: "Tchau!",
    FACTS: [
      "Um ano em Mercúrio só dura 88 dias.",
      "Apesar de ser mais distante do sol, Venus é mais quente que Mercúrio.",
      "Visto de marte, o sol parece ser metade to tamanho que nós vemos da terra.",
      "Júpiter tem os dias mais curtos entre os planetas no nosso sistema solar.",
      "O sol é quase uma esfera perfeita.",
    ],
  } as IStrings,
};

export enum LocaleTypes {
  de = "de",
  deDE = "de-DE",
  en = "en",
  enAU = "en-AU",
  enCA = "en-CA",
  enGB = "en-GB",
  enIN = "en-IN",
  enUS = "en-US",
  es = "es",
  esES = "es-ES",
  esMX = "es-MX",
  fr = "fr",
  frFR = "fr-FR",
  it = "it",
  itIT = "it-IT",
  ja = "ja",
  jaJP = "ja-JP",
  pt = "pt",
  ptBR = "pt-BR",
}

// constructs i18n and l10n data structure
// translations for this sample can be found at the end of this file
const languageStrings: i18next.Resource = {
  de: deData,
  "de-DE": dedeData,
  en: enData,
  "en-AU": enauData,
  "en-CA": encaData,
  "en-GB": engbData,
  "en-IN": eninData,
  "en-US": enusData,
  es: esData,
  "es-ES": esesData,
  "es-MX": esmxData,
  fr: frData,
  "fr-FR": frfrData,
  it: itData,
  "it-IT": ititData,
  ja: jpData,
  "ja-JP": jpjpData,
  pt: ptData,
  "pt-BR": ptData,
};
