export class User {
  firstName: string
  lastName: string
  photoUrl: string

  constructor({ firstName, lastName, photoUrl }: { firstName: string; lastName: string; photoUrl: string }) {
    this.firstName = firstName
    this.lastName = lastName
    this.photoUrl = photoUrl
  }
}
