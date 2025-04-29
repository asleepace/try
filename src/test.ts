import { Try } from './index'

export function conciseUrlExample() {
  const userInput = ''
  const FALLBACK_URL = ''

  const url = Try.catch(() => new URL(`${userInput}`))
    .or(() => new URL(`https://${userInput}`))
    .or(() => new URL(`https://${userInput.trim()}`))
    .or(() => new URL(`https://${userInput.split('://')[1]}`))
    .unwrapOr(new URL(FALLBACK_URL))

  console.log(url.href) // type-safe
}

async function synAsyncExample(userInput: string): Promise<number | undefined> {
  const [url, invalidInput] = Try.catch(() => new URL(userInput))
  const [res, networkError] = await Try.catch(() => fetch(url!))
  const [jsn, parsingError] = await Try.catch(async () => {
    const json = await res!.json()
    return json as { userId: number }
  })

  if (invalidInput || networkError || parsingError) {
    console.warn('Could not fetch user provided url:', url)
    return undefined
  }

  return jsn.userId
}

async function catchSpecificException() {
  class NotFound extends Error {
    public code = 404
  }
  class NotAuthorized extends Error {
    public code = 401
  }
  class ServerError extends Error {
    public code = 500
  }

  function doSomething() {
    if (Math.random() < 0.4) throw new ServerError()
    if (Math.random() < 0.6) throw new NotFound()
    if (Math.random() < 0.8) throw new NotAuthorized()
    return 123
  }

  const [value, error] = Try.catch(doSomething)
}
