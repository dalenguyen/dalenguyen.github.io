import { HttpClient } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'

interface Product {
  category: string
  title: string
  price: number
  image: string
}

@Component({
  selector: 'dalenguyen-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  products = [] as Product[]

  productUrl = 'https://fakestoreapi.com/products'

  // Get product from database
  // CMS capabilities with files
  // Have users database?
  // Authentication?
  // Stripe webhooks?

  constructor(private http: HttpClient) {
    this.http.get(this.productUrl).subscribe((products) => {
      // console.log(products)
      this.products = products as any
    })
  }

  ngOnInit(): void {}
}
