import unittest

from translator import translate


class TranslateTests(unittest.TestCase):
    def test_translates_supported_word(self) -> None:
        self.assertEqual(translate("Hello"), "hola")

    def test_preserves_unknown_word(self) -> None:
        self.assertEqual(translate("Codex"), "Codex")

    def test_rejects_empty_text(self) -> None:
        with self.assertRaises(ValueError):
            translate("   ")

    def test_rejects_unsupported_pair(self) -> None:
        with self.assertRaises(ValueError):
            translate("hello", source="en", target="fr")


if __name__ == "__main__":
    unittest.main()
