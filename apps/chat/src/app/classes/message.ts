import { User } from './user'

export class Message {
  message: string
  createdAt: string
  sender: User

  constructor({ message, createdAt, sender }: { message: string; createdAt: string; sender: User }) {
    this.message = message
    this.createdAt = createdAt
    this.sender = sender
  }
}
