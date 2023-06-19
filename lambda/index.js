const Alexa = require("ask-sdk-core");
const axios = require("axios");

const APP_NAME = "Fan Blast One";

const messages = {
  NOTIFY_MISSING_PERMISSIONS:
    "Please enable profile permissions in the Amazon Alexa app.",
  ERROR: "Uh Oh. Looks like something went wrong.",
};

const EMAIL_PERMISSION = "alexa::profile:email:read";
const NAME_PERMISSION = "alexa::profile:name:read";
const MOBILE_PERMISSION = "alexa::profile:mobile_number:read";

const social = {
  Instagram: "ig",
  facebook: "fb",
  YouTube: "yt",
  tiktok: "tk",
  twitch: "tch",
  twitter: "twt",
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    const speakOutput =
      "Welcome Fan Blast, for fan count you can say fan count or Help. Which would you like to try?";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const fanCountIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "FanCountIntent"
    );
  },
  async handle(handlerInput) {
    const { responseBuilder, requestEnvelope } = handlerInput;

    const name = Alexa.getSlotValue(requestEnvelope, "name");

    const res = await axios.get(
      `https://api.fanblast.com/api/v1/creators/${name}/fan-counts`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const speakOutput = res
      ? `${name} has ${res.data.data.totalFanCounts} fans`
      : `sorry ${name} not found`;

    return responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();

    // return responseBuilder.speak(name).reprompt(name).getResponse();
  },
};

const msgIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "MsgIntent"
    );
  },
  async handle(handlerInput) {
    const speakOutput = `You have total ${Math.round(
      Math.random(10) * 100
    )} msg in your inbox!`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const NameIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "NameIntent"
    );
  },
  async handle(handlerInput) {
    const { serviceClientFactory, responseBuilder } = handlerInput;
    try {
      const profileName = await nameFinder(serviceClientFactory);
      if (!profileName) {
        const noNameResponse = `It looks like you don't have an name set. You can set your name from the companion app.`;
        return responseBuilder
          .speak(noNameResponse)
          .withSimpleCard(APP_NAME, noNameResponse)
          .getResponse();
      }
      const speechResponse = `Your name is here, ${profileName}`;
      return responseBuilder
        .speak(speechResponse)
        .withSimpleCard(APP_NAME, speechResponse)
        .getResponse();
    } catch (error) {
      console.log(JSON.stringify(error));
      if (error.statusCode === 403) {
        return responseBuilder
          .speak(messages.NOTIFY_MISSING_PERMISSIONS)
          .withAskForPermissionsConsentCard([NAME_PERMISSION])
          .getResponse();
      }
      console.log(JSON.stringify(error));
      const response = responseBuilder.speak(messages.ERROR).getResponse();
      return response;
    }
  },
};

const EmailIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "EmailIntent"
    );
  },
  async handle(handlerInput) {
    const { serviceClientFactory, responseBuilder } = handlerInput;
    try {
      const profileEmail = await emailFinder(serviceClientFactory);
      if (!profileEmail) {
        const noEmailResponse = `It looks like you don't have an email set. You can set your email from the companion app.`;
        return responseBuilder
          .speak(noEmailResponse)
          .withSimpleCard(APP_NAME, noEmailResponse)
          .getResponse();
      }
      const speechResponse = `Your email is here, ${profileEmail}`;
      return responseBuilder
        .speak(speechResponse)
        .withSimpleCard(APP_NAME, speechResponse)
        .getResponse();
    } catch (error) {
      console.log(JSON.stringify(error));
      if (error.statusCode === 403) {
        return responseBuilder
          .speak(messages.NOTIFY_MISSING_PERMISSIONS)
          .withAskForPermissionsConsentCard([EMAIL_PERMISSION])
          .getResponse();
      }
      console.log(JSON.stringify(error));
      const response = responseBuilder.speak(messages.ERROR).getResponse();
      return response;
    }
  },
};

const MobileIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "MobileIntent"
    );
  },
  async handle(handlerInput) {
    const { serviceClientFactory, responseBuilder } = handlerInput;
    try {
      const profileMobileObject = await mobileFinder(serviceClientFactory);

      if (!profileMobileObject) {
        const errorResponse = `It looks like you don't have a mobile number set. You can set your mobile number from the companion app.`;
        return responseBuilder
          .speak(errorResponse)
          .withSimpleCard(APP_NAME, errorResponse)
          .getResponse();
      }
      const profileMobile = profileMobileObject.phoneNumber;
      const speechResponse = `Your mobile number is, <say-as interpret-as="telephone">${profileMobile}</say-as>`;
      const cardResponse = `Your mobile number is, ${profileMobile}`;
      return responseBuilder
        .speak(speechResponse)
        .withSimpleCard(APP_NAME, cardResponse)
        .getResponse();
    } catch (error) {
      console.log(JSON.stringify(error));
      if (error.statusCode === 403) {
        return responseBuilder
          .speak(messages.NOTIFY_MISSING_PERMISSIONS)
          .withAskForPermissionsConsentCard([MOBILE_PERMISSION])
          .getResponse();
      }
      console.log(JSON.stringify(error));
      const response = responseBuilder.speak(messages.ERROR).getResponse();
      return response;
    }
  },
};

const mobileFinder = async (serviceClientFactory) => {
  const upsServiceClient = serviceClientFactory.getUpsServiceClient();
  const profileMobileObject = await upsServiceClient.getProfileMobileNumber();
};

const emailFinder = async (serviceClientFactory) => {
  const upsServiceClient = serviceClientFactory.getUpsServiceClient();
  return await upsServiceClient.getProfileEmail();
};

const nameFinder = async (serviceClientFactory) => {
  const upsServiceClient = serviceClientFactory.getUpsServiceClient();
  return await upsServiceClient.getProfileName();
};

const SocialIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "SocialIntent"
    );
  },
  async handle(handlerInput) {
    const { requestEnvelope, responseBuilder } = handlerInput;

    const username = Alexa.getSlotValue(requestEnvelope, "username");
    const socialtype = Alexa.getSlotValue(requestEnvelope, "socialtype");

    const res = await axios.get(
      `https://api.fanblast.com/api/v1/creators/${username}/detail`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const linkData =
      Object.keys(res.data.data).length !== 0
        ? res.data.data.links.find((item) => item.type == social[socialtype])
        : null;

    const speakOutput = linkData
      ? `${socialtype} link is ${linkData.url} for ${username}.`
      : `sorry ${socialtype} link for ${username} is not found`;

    return responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const StartUpdatesIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "StartUpdatesIntent"
    );
  },
  async handle(handlerInput) {
    const { requestEnvelope, responseBuilder } = handlerInput;

    const username = Alexa.getSlotValue(requestEnvelope, "username");
    const duration = Alexa.getSlotValue(requestEnvelope, "duration");

    const res = await axios.get(
      `https://api.fanblast.com/api/v1/creators/${username}/fan-counts`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const speakOutput = res
      ? `${username} has ${res.data.data.totalFanCounts} fans after ${duration}`
      : `sorry ${username} not found`;

    return responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speechText = "You can say hello to me!";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard("Hello World", speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speechText = "Goodbye!";

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`
    );

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Sorry, I can't understand the command. Please say again.")
      .reprompt("Sorry, I can't understand the command. Please say again.")
      .getResponse();
  },
};

const RequestLog = {
  process(handlerInput) {
    console.log(
      `REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
  },
};

const ResponseLog = {
  process(handlerInput) {
    console.log(`RESPONSE BUILDER = ${JSON.stringify(handlerInput)}`);
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    SocialIntentHandler,
    StartUpdatesIntentHandler,
    EmailIntentHandler,
    NameIntentHandler,
    MobileIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    fanCountIntentHandler,
    msgIntentHandler
  )
  .addRequestInterceptors(RequestLog)
  .addResponseInterceptors(ResponseLog)
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
