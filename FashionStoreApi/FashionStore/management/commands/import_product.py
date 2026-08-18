import csv
from decimal import Decimal, InvalidOperation

from cloudinary.uploader import upload
from django.core.management.base import BaseCommand

from FashionStore.models import Product, Category


class Command(BaseCommand):
    help = "Import products from CSV"

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_file",
            type=str
        )

    def handle(self, *args, **options):

        csv_file = options["csv_file"]

        # =====================================================
        # Đọc CSV
        # =====================================================
        try:
            with open(
                csv_file,
                newline="",
                encoding="utf-8-sig"
            ) as file:

                reader = csv.DictReader(file)
                rows = list(reader)

        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(
                    f"Không tìm thấy file: {csv_file}"
                )
            )
            return

        total = len(rows)

        self.stdout.write(
            f"Đọc được {total} product từ CSV."
        )

        # =====================================================
        # Xóa Product cũ
        # =====================================================
        Product.objects.all().delete()

        self.stdout.write(
            self.style.WARNING(
                "Đã xóa toàn bộ Product cũ."
            )
        )

        # =====================================================
        # Load Category một lần
        # =====================================================
        category_map = {
            category.id: category
            for category in Category.objects.all()
        }

        # =====================================================
        # Counter
        # =====================================================
        success_count = 0
        skip_count = 0

        # Kiểm tra product trùng tên
        product_names = set()

        # =====================================================
        # Import Product
        # =====================================================
        for index, row in enumerate(rows, start=1):

            try:

                # -------------------------------------------------
                # Name
                # -------------------------------------------------
                name = row.get("name", "").strip()

                if not name:
                    skip_count += 1
                    continue

                # -------------------------------------------------
                # Check duplicate name
                # -------------------------------------------------
                if name in product_names:
                    skip_count += 1
                    continue

                # -------------------------------------------------
                # Product ID
                # -------------------------------------------------
                product_id_raw = row.get(
                    "product_id",
                    ""
                ).strip()

                if not product_id_raw:
                    skip_count += 1
                    continue

                product_id = int(
                    float(product_id_raw)
                )

                # -------------------------------------------------
                # Category
                # -------------------------------------------------
                category_id_raw = row.get(
                    "category_id",
                    ""
                ).strip()

                if not category_id_raw:
                    skip_count += 1
                    continue

                category_id = int(
                    float(category_id_raw)
                )

                category = category_map.get(category_id)

                if category is None:
                    skip_count += 1
                    continue

                # -------------------------------------------------
                # Thumbnail
                # -------------------------------------------------
                thumbnail_url = row.get(
                    "thumbnail",
                    ""
                ).strip()

                if not thumbnail_url:
                    skip_count += 1
                    continue

                # -------------------------------------------------
                # Upload Cloudinary
                # -------------------------------------------------
                result = upload(thumbnail_url)

                public_id = result["public_id"]

                # -------------------------------------------------
                # Description
                # -------------------------------------------------
                description = row.get(
                    "description",
                    ""
                ).strip()

                if not description:
                    description = None

                # -------------------------------------------------
                # Price
                # -------------------------------------------------
                price_raw = row.get(
                    "price",
                    ""
                ).strip()

                if not price_raw:
                    skip_count += 1
                    continue

                price = Decimal(price_raw)

                # -------------------------------------------------
                # Quantity sold
                # -------------------------------------------------
                quantity_sold_raw = row.get(
                    "quantity_sold",
                    ""
                ).strip()

                if quantity_sold_raw:
                    quantity_sold = int(
                        float(quantity_sold_raw)
                    )
                else:
                    quantity_sold = 0

                # -------------------------------------------------
                # Rating
                # -------------------------------------------------
                rating_raw = row.get(
                    "rating_average",
                    ""
                ).strip()

                if rating_raw:
                    rating_average = Decimal(
                        rating_raw
                    )
                else:
                    rating_average = Decimal("0")

                # -------------------------------------------------
                # Create Product
                # -------------------------------------------------
                Product.objects.create(
                    id=product_id,
                    name=name,
                    description=description,
                    thumbnail=public_id,
                    price=price,
                    quantity_sold=quantity_sold,
                    average_rating=rating_average,
                    category=category
                )

                # -------------------------------------------------
                # Mark name as used
                # -------------------------------------------------
                product_names.add(name)

                success_count += 1

            # =====================================================
            # Handle lỗi
            # =====================================================
            except InvalidOperation:
                skip_count += 1

            except ValueError:
                skip_count += 1

            except Exception:
                skip_count += 1

            # =====================================================
            # Hiển thị trạng thái
            # =====================================================
            print(
                f"\rImporting products: "
                f"{index}/{total} "
                f"| Success: {success_count} "
                f"| Skip: {skip_count}",
                end="",
                flush=True
            )

        # Xuống dòng sau khi import xong
        print()

        # =====================================================
        # Kết quả
        # =====================================================
        self.stdout.write("")
        self.stdout.write("=" * 50)

        self.stdout.write(
            self.style.SUCCESS(
                f"Import success: {success_count} product."
            )
        )

        if skip_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"Skip: {skip_count} product."
                )
            )

        self.stdout.write(
            f"Total CSV: {total} product."
        )

        self.stdout.write("=" * 50)