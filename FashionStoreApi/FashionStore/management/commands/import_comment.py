import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from FashionStore.models import Rating, Product, User


class Command(BaseCommand):
    help = "Import ratings from CSV"

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
            user_id = row.get("user_id", "").strip()
            rate_raw = row.get("rate", "").strip()
            comment = row.get("comment", "").strip()

            try:
                if not product_id:
                    raise ValueError("Thiếu product_id")

                if not user_id:
                    raise ValueError("Thiếu user_id")

                if not rate_raw:
                    raise ValueError("Thiếu rate")

                product = Product.objects.filter(id=product_id).first()
                if not product:
                    raise ValueError(f"Không tồn tại Product {product_id}")

                user = User.objects.filter(id=user_id).first()
                if not user:
                    raise ValueError(f"Không tồn tại User {user_id}")

                rate = int(rate_raw)

                if rate < 1 or rate > 5:
                    raise ValueError("rate phải từ 1 đến 5")

                if len(comment) > 500:
                    raise ValueError("comment vượt quá 500 ký tự")

                if Rating.objects.filter(user=user, product=product).exists():
                    raise ValueError("User đã rating Product này")

                Rating.objects.create(
                    product=product, user=user, rate=rate, comment=comment or None
                )

                success_count += 1
                logs.append([index, product_id, user_id, rate, "SUCCESS", ""])

            except ValueError as e:
                skip_count += 1
                logs.append([index, product_id, user_id, rate_raw, "SKIP", str(e)])

            except Exception as e:
                skip_count += 1
                logs.append([index, product_id, user_id, rate_raw, "SKIP", str(e)])

            print(
                f"\rImporting ratings: {index}/{total} | Success: {success_count} | Skip: {skip_count}",
                end="",
            )

        log_file = Path(csv_file).parent / "import_ratings_log.csv"

        with open(log_file, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(
                ["row", "product_id", "user_id", "rate", "status", "reason"]
            )
            writer.writerows(logs)

        print(
            f"\rImporting ratings: {total}/{total} | Success: {success_count} | Skip: {skip_count}"
        )
