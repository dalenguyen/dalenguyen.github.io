export class User {
  id?: string
  firstName: string
  lastName: string
  photoUrl: string
  email?: string
  quote?: string
  bio?: string

  constructor({ firstName, lastName, photoUrl }: { firstName: string; lastName: string; photoUrl: string }) {
    this.firstName = firstName
    this.lastName = lastName
    this.photoUrl = photoUrl
  }
}
