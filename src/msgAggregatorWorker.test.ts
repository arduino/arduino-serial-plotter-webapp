/*
  Copyright (C) 2022 Arduino SA

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

class WorkerStub {
  listener = (_: { data: { command: string } }) => {};
  addEventListener(_: string, listenerCallback: (event: object) => void) {
    this.listener = listenerCallback;
  }
}
let worker = new WorkerStub();
(global as any).self = worker;

const messageAggregator = require("./msgAggregatorWorker");

beforeEach(() => {
  worker.listener({ data: { command: "cleanup" } });
});

describe("Parsing data", () => {
  describe.each([
    ["space", " "],
    ["tab", "\t"],
    ["comma", ","],
  ])("%s field delimiter", (_, fieldDelimiter) => {
    describe.each([
      ["trailing", fieldDelimiter],
      ["no trailing", ""],
    ])("%s", (_, trailingFieldDelimiter) => {
      describe.each([
        ["LF", "\n"],
        ["CRLF", "\r\n"],
      ])("%s record delimiter", (_, recordDelimiter) => {
        test("single field", () => {
          const messages = [
            `0${trailingFieldDelimiter}${recordDelimiter}`,
            `1${trailingFieldDelimiter}${recordDelimiter}`,
            `2${trailingFieldDelimiter}${recordDelimiter}`,
          ];

          const assertion = {
            datasetNames: ["value 1"],
            parsedLines: [{ "value 1": 1 }, { "value 1": 2 }],
          };

          expect(messageAggregator.parseSerialMessages(messages)).toEqual(
            assertion
          );
        });

        test("multi-field", () => {
          const messages = [
            `0${trailingFieldDelimiter}${recordDelimiter}`,
            `1${fieldDelimiter}2${trailingFieldDelimiter}${recordDelimiter}`,
            `3${fieldDelimiter}4${trailingFieldDelimiter}${recordDelimiter}`,
          ];

          const assertion = {
            datasetNames: ["value 1", "value 2"],
            parsedLines: [
              { "value 1": 1, "value 2": 2 },
              { "value 1": 3, "value 2": 4 },
            ],
          };

          expect(messageAggregator.parseSerialMessages(messages)).toEqual(
            assertion
          );
        });

        test("labeled", () => {
          const messages = [
            `0${trailingFieldDelimiter}${recordDelimiter}`,
            `label_1:1${fieldDelimiter}label_2:2${trailingFieldDelimiter}${recordDelimiter}`,
            `label_1:3${fieldDelimiter}label_2:4${trailingFieldDelimiter}${recordDelimiter}`,
          ];

          const assertion = {
            datasetNames: ["label_1", "label_2"],
            parsedLines: [
              { label_1: 1, label_2: 2 },
              { label_1: 3, label_2: 4 },
            ],
          };

          expect(messageAggregator.parseSerialMessages(messages)).toEqual(
            assertion
          );
        });

        test("buffering", () => {
          // Incomplete record
          let messages = [
            `0${trailingFieldDelimiter}${recordDelimiter}`,
            `1${fieldDelimiter}`,
          ];

          // Incomplete message is buffered
          let assertion: {
            datasetNames: string[];
            parsedLines: { [key: string]: number }[];
          } = {
            datasetNames: [],
            parsedLines: [],
          };

          expect(messageAggregator.parseSerialMessages(messages)).toEqual(
            assertion
          );

          // Second part of the record
          messages = [`2${trailingFieldDelimiter}${recordDelimiter}`];

          assertion = {
            datasetNames: ["value 1", "value 2"],
            parsedLines: [{ "value 1": 1, "value 2": 2 }],
          };

          expect(messageAggregator.parseSerialMessages(messages)).toEqual(
            assertion
          );
        });
      });
    });
  });
});

export {};
