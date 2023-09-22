import React, { Component } from "react";
import { Container } from "reactstrap";
import { getTokenOrRefresh } from "./token_util";
import "./custom.css";
import { ResultReason } from "microsoft-cognitiveservices-speech-sdk";
import env from "react-dotenv";

const speechsdk = require("microsoft-cognitiveservices-speech-sdk");

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displayText: "INITIALIZED: ready to test speech...",
      allTexts: []
    };
  }

  async componentDidMount() {
    // check for valid speech key/region
    const tokenRes = await getTokenOrRefresh();
    if (tokenRes.authToken === null) {
      this.setState({
        displayText: "FATAL_ERROR: " + tokenRes.error,
      });
    }
  }

  async sttFromMicCore(recognizer, stopTime) {
    console.log(`sttFromMicCore started: ${Date.now()}`);

    recognizer.recognizeOnceAsync((result) => {
      let displayText;
      if (result.reason === ResultReason.RecognizedSpeech) {
        displayText = `RECOGNIZED: time=${Date.now()}, Text=${result.text}`;
        console.log(`RECOGNIZED: time=${Date.now()}, Text=${result.text}`);
        const newTexts = [...this.state.allTexts, result.text]
        this.setState({
          displayText: displayText,
          allTexts: newTexts
        });
        if (Date.now() < stopTime) {
          this.sttFromMicCore(recognizer, stopTime);
        } else {
          console.log(`Timed out,  ${Date.now()}`);
          console.log(`All texts, length: ${this.state.allTexts.length}`);
          this.state.allTexts.map( (line) => console.log(line));
        }
      } else {
        displayText =
          "ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.";
        console.log(displayText);
        this.setState({
          displayText: displayText,
        });

        if (Date.now() < stopTime) {
          this.sttFromMicCore(recognizer, stopTime);
        }else {
            console.log(`Error: Timed out,  ${Date.now()}`);
            this.state.allTexts.map( (line) => console.log(line));
          }
      }

      // this.setState({
      //   displayText: displayText,
      // });
    });
  }

  async sttFromMicContinuous() {
    const speechKey = env.SPEECH_KEY;
    const speechRegion = env.SPEECH_REGION;
    console.log(`speechKey: ${speechKey}, speechRegion: ${speechRegion}`);

    const speechConfig = speechsdk.SpeechConfig.fromSubscription(
      speechKey,
      speechRegion
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new speechsdk.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    this.setState({
      displayText: "speak into your microphone...",
    });

    const duration = 15*60*1000;
    const stopTime = Date.now() + duration;

    this.sttFromMicCore(recognizer, stopTime);

  }

  // async sttFromMicContinuous() {
  //   const tokenObj = await getTokenOrRefresh();
  //   const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(
  //     tokenObj.authToken,
  //     tokenObj.region
  //   );
  //   speechConfig.speechRecognitionLanguage = "en-US";

  //   const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
  //   const recognizer = new speechsdk.SpeechRecognizer(
  //     speechConfig,
  //     audioConfig
  //   );

  //   this.setState({
  //     displayText: "speak into your microphone...",
  //   });

  //   const duration = 15*60*1000;
  //   const stopTime = Date.now() + duration;

  //   this.sttFromMicCore(recognizer, stopTime);

  // }

  async sttFromMic() {
    const tokenObj = await getTokenOrRefresh();
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(
      tokenObj.authToken,
      tokenObj.region
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new speechsdk.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    this.setState({
      displayText: "speak into your microphone...",
    });

    recognizer.recognizeOnceAsync((result) => {
      let displayText;
      if (result.reason === ResultReason.RecognizedSpeech) {
        displayText = `RECOGNIZED: Text=${result.text}`;
      } else {
        displayText =
          "ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.";
      }

      this.setState({
        displayText: displayText,
      });
    });
  }

  async fileChange(event) {
    const audioFile = event.target.files[0];
    console.log(audioFile);
    const fileInfo = audioFile.name + ` size=${audioFile.size} bytes `;

    this.setState({
      displayText: fileInfo,
    });

    const tokenObj = await getTokenOrRefresh();
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(
      tokenObj.authToken,
      tokenObj.region
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioFile);
    const recognizer = new speechsdk.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    recognizer.recognizeOnceAsync((result) => {
      let displayText;
      if (result.reason === ResultReason.RecognizedSpeech) {
        displayText = `RECOGNIZED: Text=${result.text}`;
      } else {
        displayText =
          "ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.";
      }

      this.setState({
        displayText: fileInfo + displayText,
      });
    });
  }

  render() {
    return (
      <Container className="app-container">
        <h1 className="display-4 mb-3">Speech sample app</h1>

        <div className="row main-container">
          <div className="col-12">
            <i
              className="fas fa-microphone fa-lg mr-2"
              //   onClick={() => this.sttFromMic()}
              onClick={() => this.sttFromMicContinuous()}
            ></i>
            Convert speech to text from your mic.
            <div className="mt-2">
              <label htmlFor="audio-file">
                <i className="fas fa-file-audio fa-lg mr-2"></i>
              </label>
              <input
                type="file"
                id="audio-file"
                onChange={(e) => this.fileChange(e)}
                style={{ display: "none" }}
              />
              Convert speech to text from an audio file.
            </div>
          </div>
          <div>&nbsp;</div>
          <div className="col-12 output-display rounded">
            <code>{this.state.displayText}</code>
          </div>
        </div>
      </Container>
    );
  }
}
