import { test, expect } from 'bun:test'
import { Res, Try, TryResult, vet } from '../src/index'

class NetworkError extends Error {
  public code: number
}

class NotFound extends NetworkError {
  public code: number = 404
  constructor(public path: string) {
    super(`Path not found: ${path}`)
  }
}

class NotAuthorized extends NetworkError {
  public code: number = 401
  constructor(public userId: number) {
    super(`User not authorized: ${userId}`)
  }
}

class ServerError extends NetworkError {
  public code: number = 500
  constructor(public isFatal: boolean) {
    super(`Encountered server issue (fatal=${isFatal})`)
  }
}

class User {
  constructor(public userId: number, public name: string) {}
}

class Admin extends User {
  public isAdmin = true
}

function makeNetworkRequest() {
  const status = Math.floor(Math.random() * 500)
  if (status <= 200) throw new NotFound('/example')
  if (status <= 400) throw new NotAuthorized(117)
  if (status <= 600) throw new ServerError(true)
  if (status <= 800) {
    return new User(117, 'John')
  } else {
    return new Admin(415, 'Adam')
  }
}

//  ================================================
//  Test Suite
//  ================================================

test('Can narrow expected error types', () => {
  const result = Try.catch(makeNetworkRequest)


  if (result.matchError(NotFound)) {
    console.log(result.error.name)
  }


})
