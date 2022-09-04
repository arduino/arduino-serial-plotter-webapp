const separator = "\n";
// format1: <value1> <value2> <value3>
export const generateRandomMessages = () => {
  const messages: string[] = [];

  for (let i = 0; i < 1; i++) {
    const variables = [];
    for (let j = 1; j < 9; j++) {
      // generate serie name
      variables.push(`${Math.floor(Math.random() * 10)}`);
    }
    let line = variables.join(" ");

    messages.push(line + separator);
  }

  return messages;
};

const genNamedVarValPair = (i: number) => {
  const name = `name ${i}`;
  const val = `${Math.floor(Math.random() * 10)}`;
  return `${name}:${val}`;
};

// format2: name1:<value1>,name2:<value2>,name3:<value3>
export const namedVariables = () => {
  const messages: string[] = [];

  for (let i = 1; i <= 9; i++) {
    let pair = genNamedVarValPair(i);
    messages.push(pair);
  }
  return [messages.join(",") + separator];
};

export const namedVariablesMulti = () => {
  const messages: string[] = [];

  for (let i = 1; i <= 30; i++) {
    messages.push(...namedVariables());
  }
  return messages;
};

function* variableIdexes(): Generator<number[]> {
  let index = 0;
  while (true) {
    index++;
    if (index > 9) {
      yield [1, 3];
    } else {
      yield [1, 2, 3];
    }
  }
}

// alternates
// name1:<value1>,name2:<value2>,name3:<value3>
// and
// name1:<value1>,name3:<value3>
// every 10 messages
const iterator = variableIdexes();
export const jumpyNamedVariables = () => {
  const messages: string[] = [];

  for (let i of iterator.next().value) {
    let pair = genNamedVarValPair(i);
    messages.push(pair);
  }
  return [messages.join(",") + separator];
};
