import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import OutCall "http-outcalls/outcall";

actor {
  transient let textMap = OrderedMap.Make<Text>(Text.compare);

  var settings : OrderedMap.Map<Text, Text> = textMap.empty();

  public func getSettings() : async [(Text, Text)] {
    Iter.toArray(textMap.entries(settings));
  };

  public func updateSetting(key : Text, value : Text) : async () {
    settings := textMap.put(settings, key, value);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func startLivepeerStream(streamName : Text) : async Text {
    let apiKey = "fc64e496-7b2e-4b32-96c0-56de02a517cb";
    let url = "https://livepeer.com/api/stream";
    let headers = [
      {
        name = "Authorization";
        value = "Bearer " # apiKey;
      },
      {
        name = "Content-Type";
        value = "application/json";
      },
    ];
    let body = "{ \"name\": \"" # streamName # "\" }";
    await OutCall.httpPostRequest(url, headers, body, transform);
  };

  public func getLivepeerStreamStatus(streamId : Text) : async Text {
    let apiKey = "fc64e496-7b2e-4b32-96c0-56de02a517cb";
    let url = "https://livepeer.com/api/stream/" # streamId;
    let headers = [
      {
        name = "Authorization";
        value = "Bearer " # apiKey;
      },
    ];
    await OutCall.httpGetRequest(url, headers, transform);
  };

  public func stopLivepeerStream(streamId : Text) : async Text {
    let apiKey = "fc64e496-7b2e-4b32-96c0-56de02a517cb";
    let url = "https://livepeer.com/api/stream/" # streamId # "/terminate";
    let headers = [
      {
        name = "Authorization";
        value = "Bearer " # apiKey;
      },
      {
        name = "Content-Type";
        value = "application/json";
      },
    ];
    await OutCall.httpPostRequest(url, headers, "{}", transform);
  };

  public func updateStreamingStatus(isStreaming : Bool) : async () {
    let status = if (isStreaming) { "active" } else { "inactive" };
    settings := textMap.put(settings, "streamingStatus", status);
  };

  public func getStreamingStatus() : async Text {
    switch (textMap.get(settings, "streamingStatus")) {
      case (?status) { status };
      case null { "inactive" };
    };
  };
};

