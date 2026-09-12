import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path

from cloudinary.uploader import upload
from django.core.management.base import BaseCommand

from FashionStore.models import Product, Category


class Command(BaseCommand):
    help = "Import products from CSV"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str)

    def handle(self, *args, **options):
        csv_file = options["csv_file"]
        log_file = Path(csv_file).parent / "import_products_log.csv"

        try:
            with open(csv_file, newline="", encoding="utf-8-sig") as file:
                rows = list(csv.DictReader(file))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"Không tìm thấy file: {csv_file}"))
            return

        total = len(rows)
        category_map = {category.id: category for category in Category.objects.all()}
        success_count = 0
        skip_count = 0
        logs = []

        for index, row in enumerate(rows, start=1):
            product_id = row.get("id", "").strip()
            name = row.get("name", "").strip()

            try:
                if not product_id:
                    skip_count += 1
                    logs.append([index, product_id, name, "SKIP", "Thiếu id"])
                    continue

                product_id = int(float(product_id))

                if Product.objects.filter(id=product_id).exists():
                    skip_count += 1
                    logs.append([index, product_id, name, "SKIP", "id đã tồn tại"])
                    continue

                if not name:
                    skip_count += 1
                    logs.append([index, product_id, name, "SKIP", "Thiếu name"])
                    continue

                if Product.objects.filter(name=name).exists():
                    skip_count += 1
                    logs.append([index, product_id, name, "SKIP", "name đã tồn tại"])
                    continue

                category_id = row.get("category_id", "").strip()

                if not category_id:
                    skip_count += 1
                    logs.append([index, product_id, name, "SKIP", "Thiếu category_id"])
                    continue

                category_id = int(float(category_id))
                category = category_map.get(category_id)

                if category is None:
                    skip_count += 1
                    logs.append([
                        index,
                        product_id,
                        name,
                        "SKIP",
                        f"category_id {category_id} không tồn tại"
                    ])
                    continue

                thumbnail_url = row.get("thumbnail", "").strip()

                if not thumbnail_url:
                    skip_count += 1
                    logs.append([index, product_id, name, "SKIP", "Thiếu thumbnail"])
                    continue

                price_raw = row.get("price", "").strip()

                if not price_raw:
                    skip_count += 1
                    logs.append([index, product_id, name, "SKIP", "Thiếu price"])
                    continue

                price = Decimal(price_raw)

                if price < 0:
                    skip_count += 1
                    logs.append([index, product_id, name, "SKIP", "price không hợp lệ"])
                    continue

                rating_raw = row.get("average_rating", "").strip()
                average_rating = Decimal(rating_raw) if rating_raw else Decimal("0")

                if average_rating < 0 or average_rating > 5:
                    skip_count += 1
                    logs.append([
                        index,
                        product_id,
                        name,
                        "SKIP",
                        "average_rating phải từ 0 đến 5"
                    ])
                    continue

                quantity_sold_raw = row.get("quantity_sold", "").strip()
                quantity_sold = int(float(quantity_sold_raw)) if quantity_sold_raw else 0

                if quantity_sold < 0:
                    skip_count += 1
                    logs.append([
                        index,
                        product_id,
                        name,
                        "SKIP",
                        "quantity_sold không hợp lệ"
                    ])
                    continue

                description = row.get("description", "").strip()

                is_active_raw = row.get("is_active", "").strip()

                if is_active_raw:
                    is_active = is_active_raw.lower() in ["1", "true", "yes"]
                else:
                    is_active = True

                result = upload(thumbnail_url)
                public_id = result["public_id"]

                Product.objects.create(
                    id=product_id,
                    name=name,
                    description=description,
                    thumbnail=public_id,
                    price=price,
                    average_rating=average_rating,
                    quantity_sold=quantity_sold,
                    is_active=is_active,
                    category=category,
                )

                success_count += 1
                logs.append([
                    index,
                    product_id,
                    name,
                    "SUCCESS",
                    "Import thành công"
                ])

            except InvalidOperation:
                skip_count += 1
                logs.append([
                    index,
                    product_id,
                    name,
                    "SKIP",
                    "price hoặc average_rating không hợp lệ"
                ])

            except ValueError:
                skip_count += 1
                logs.append([
                    index,
                    product_id,
                    name,
                    "SKIP",
                    "id, category_id hoặc quantity_sold không hợp lệ"
                ])

            except Exception as e:
                skip_count += 1
                logs.append([
                    index,
                    product_id,
                    name,
                    "SKIP",
                    str(e)
                ])

            print(
                f"\rImporting products: {index}/{total} | Success: {success_count} | Skip: {skip_count}",
                end="",
                flush=True
            )

        print()

        with open(log_file, "w", newline="", encoding="utf-8-sig") as file:
            writer = csv.writer(file)
            writer.writerow([
                "row",
                "id",
                "name",
                "status",
                "reason"
            ])
            writer.writerows(logs)

        self.stdout.write(
            self.style.SUCCESS(
                f"Hoàn thành: {success_count} success | {skip_count} skip"
            )
        )
        self.stdout.write(f"Log: {log_file}")