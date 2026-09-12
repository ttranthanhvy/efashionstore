import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path
from cloudinary.uploader import upload
from django.core.management.base import BaseCommand
from FashionStore.models import Product, ProductVariant


class Command(BaseCommand):
    help = "Import product variants from CSV"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str)

    def handle(self, *args, **options):
        csv_file = options["csv_file"]
        logs = []
        success_count = 0
        skip_count = 0

        with open(csv_file, "r", encoding="utf-8-sig", newline="") as f:
            rows = list(csv.DictReader(f))

        total = len(rows)

        for index, row in enumerate(rows, 1):
            product_id = row.get("product_id", "").strip()
            variant_id = row.get("product_variant_id", "").strip()
            color = row.get("color", "").strip()
            size = row.get("size", "").strip()
            price_raw = row.get("price", "").strip()
            image_url = row.get("image", "").strip()
            stock_raw = row.get("stock", "").strip()
            min_stock_raw = row.get("min_stock", "").strip()

            try:
                if not product_id:
                    raise ValueError("Thiếu product_id")

                if not variant_id:
                    raise ValueError("Thiếu product_variant_id")

                if not Product.objects.filter(id=product_id).exists():
                    raise ValueError(f"Không tồn tại Product {product_id}")

                if ProductVariant.objects.filter(id=variant_id).exists():
                    raise ValueError("product_variant_id đã tồn tại")

                if not image_url:
                    raise ValueError("Thiếu image")

                price = Decimal(price_raw)
                stock = int(stock_raw)
                min_stock = int(min_stock_raw)

                if price < 0:
                    raise ValueError("price không hợp lệ")

                if stock < 0:
                    raise ValueError("stock không hợp lệ")

                if min_stock < 0:
                    raise ValueError("min_stock không hợp lệ")

                result = upload(image_url, timeout=30)
                public_id = result["public_id"]

                ProductVariant.objects.create(
                    id=variant_id,
                    product_id=product_id,
                    color=color or None,
                    size=size or None,
                    price=price,
                    image=public_id,
                    stock=stock,
                    min_stock=min_stock,
                    is_active=True,
                )

                success_count += 1
                logs.append([index, product_id, variant_id, "SUCCESS", ""])

            except InvalidOperation:
                skip_count += 1
                logs.append(
                    [index, product_id, variant_id, "SKIP", "price không hợp lệ"]
                )

            except ValueError as e:
                skip_count += 1
                logs.append([index, product_id, variant_id, "SKIP", str(e)])

            except Exception as e:
                skip_count += 1
                logs.append(
                    [
                        index,
                        product_id,
                        variant_id,
                        "SKIP",
                        f"Cloudinary/System: {str(e)}",
                    ]
                )

            print(
                f"\rImporting variants: {index}/{total} | Success: {success_count} | Skip: {skip_count}",
                end="",
            )

        log_file = Path(csv_file).parent / "import_variants_log.csv"

        with open(log_file, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(
                ["row", "product_id", "product_variant_id", "status", "reason"]
            )
            writer.writerows(logs)

        print(
            f"\rImporting variants: {total}/{total} | Success: {success_count} | Skip: {skip_count}"
        )
