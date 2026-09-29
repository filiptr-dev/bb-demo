import math

import pytest

from app.modules.catalog.calculations import (
    CalculationError,
    equivalent_load,
    rating_life,
    relubrication_interval,
)

DGBB_6205 = {"f0": 14.0, "kr": 0.03}  # SKF factors; C = 14.8 kN, C0 = 7.8 kN


def test_radial_load_only() -> None:
    load = equivalent_load("deep-groove", 2, 0, {})
    assert (load.p, load.x, load.y, load.e) == (2, 1, 0, None)


def test_deep_groove_axial_load_below_e() -> None:
    # f0·Fa/C0 = 14·0.5/7.8 = 0.897 → e ≈ 0.272 > Fa/Fr = 0.25 → P = Fr
    load = equivalent_load("deep-groove", 2, 0.5, DGBB_6205, c0=7.8)
    assert load.p == 2
    t = (14 * 0.5 / 7.8 - 0.689) / (1.03 - 0.689)
    assert load.e == pytest.approx(0.26 + t * 0.02)


def test_deep_groove_axial_load_above_e() -> None:
    # f0·Fa/C0 = 1.795, between the 1.38 and 2.07 rows → Y ≈ 1.366; Fa/Fr = 0.5 > e ≈ 0.324
    load = equivalent_load("deep-groove", 2, 1, DGBB_6205, c0=7.8)
    t = (14 / 7.8 - 1.38) / (2.07 - 1.38)
    y = 1.45 + t * (1.31 - 1.45)
    assert load.x == 0.56
    assert load.y == pytest.approx(y)
    assert load.p == pytest.approx(0.56 * 2 + y * 1)
    assert load.p == pytest.approx(2.4858, abs=1e-4)


def test_deep_groove_table_is_held_at_its_ends() -> None:
    tiny = equivalent_load("deep-groove", 0, 0.01, DGBB_6205, c0=7.8)  # pure axial: X·0 + Y·Fa
    assert tiny.y == 2.30
    huge = equivalent_load("deep-groove", 1, 5, DGBB_6205, c0=7.8)
    assert huge.y == 1.00


def test_spherical_roller() -> None:
    f = {"e": 0.24, "Y0": 2.8, "Y1": 2.8, "Y2": 4.2}
    assert equivalent_load("spherical-roller", 10, 2, f).p == pytest.approx(10 + 2.8 * 2)  # Fa/Fr = 0.2 ≤ e
    assert equivalent_load("spherical-roller", 10, 3, f).p == pytest.approx(0.67 * 10 + 4.2 * 3)  # 0.3 > e


def test_self_aligning_ball() -> None:
    f = {"e": 0.28, "Y1": 2.2, "Y2": 3.5}
    assert equivalent_load("self-aligning", 10, 5, f).p == pytest.approx(0.65 * 10 + 3.5 * 5)


def test_paired_angular_contact_uses_the_given_x() -> None:
    f = {"X": 0.57, "e": 1.1, "Y1": 0.55, "Y2": 0.93}
    assert equivalent_load("angular-contact", 10, 5, f).p == pytest.approx(10 + 0.55 * 5)
    assert equivalent_load("angular-contact", 10, 20, f).p == pytest.approx(0.57 * 10 + 0.93 * 20)


def test_tapered_and_cylindrical_roller() -> None:
    assert equivalent_load("tapered-roller", 10, 3, {"e": 0.37, "Y": 1.6}).p == 10
    assert equivalent_load("tapered-roller", 10, 5, {"e": 0.37, "Y": 1.6}).p == pytest.approx(0.4 * 10 + 1.6 * 5)
    assert equivalent_load("cylindrical-roller", 10, 1, {"e": 0.2, "Y": 0.6}).p == 10
    assert equivalent_load("cylindrical-roller", 10, 3, {"e": 0.2, "Y": 0.6}).p == pytest.approx(0.92 * 10 + 0.6 * 3)


def test_thrust_ball() -> None:
    assert equivalent_load("thrust-ball", 0, 5, {}).p == 5
    with pytest.raises(CalculationError) as e:
        equivalent_load("thrust-ball", 1, 5, {})
    assert e.value.code == "load_case_unsupported"


@pytest.mark.parametrize(("bearing_type", "factors"), [("needle-roller", {}), ("deep-groove", {}), ("toroidal", {})])
def test_axial_load_needs_factors(bearing_type: str, factors: dict[str, float]) -> None:
    with pytest.raises(CalculationError) as e:
        equivalent_load(bearing_type, 5, 1, factors)
    assert e.value.code == "load_case_unsupported"


def test_basic_rating_life_ball() -> None:
    # 6205, P = 2 kN, 1500 r/min: L10 = 7.4³ = 405.2 million rev = 4502 h
    life = rating_life(14.8, 2, 1500, ball=True)
    assert life.exponent == 3
    assert life.l10 == pytest.approx(7.4**3)
    assert life.l10h == pytest.approx(7.4**3 * 1e6 / (60 * 1500))
    assert life.l10h == pytest.approx(4502.5, abs=0.1)
    assert (life.a1, life.lnmh) == (1.0, life.l10h)


def test_basic_rating_life_roller_and_reliability() -> None:
    life = rating_life(159, 15.6, 500, ball=False, reliability=99)
    assert life.exponent == pytest.approx(10 / 3)
    assert life.l10 == pytest.approx((159 / 15.6) ** (10 / 3))
    assert life.a1 == 0.25
    assert life.lnm == pytest.approx(0.25 * life.l10)
    assert life.lnmh == pytest.approx(0.25 * life.l10h)


def test_relubrication_interval() -> None:
    # 6205 at 3000 r/min: 10·(14e6/(3000·√25) - 4·25) = 8333 h
    r = relubrication_interval("deep-groove", 25, 3000, outer_d=52, width=15)
    assert r.base_hours == pytest.approx(10 * (14e6 / (3000 * 5) - 100))
    assert r.hours == r.base_hours
    assert r.grease_side_g == pytest.approx(3.9)
    assert r.grease_center_g == pytest.approx(1.56)
    assert not r.capped


def test_relubrication_temperature_and_vertical_shaft() -> None:
    r = relubrication_interval("deep-groove", 25, 3000, temperature=85, vertical_shaft=True)
    assert r.hours == pytest.approx(r.base_hours / 4)  # 15 °C over 70 halves it, vertical halves it again
    assert relubrication_interval("deep-groove", 25, 3000, temperature=40).hours == r.base_hours  # not extended
    assert r.grease_side_g is None


def test_relubrication_roller() -> None:
    r = relubrication_interval("spherical-roller", 60, 1500)
    assert r.k == 1
    assert r.base_hours == pytest.approx(14e6 / (1500 * math.sqrt(60)) - 240)


def test_relubrication_cap_and_range() -> None:
    slow = relubrication_interval("deep-groove", 25, 100)
    assert (slow.hours, slow.capped) == (30_000, True)
    with pytest.raises(CalculationError) as e:
        relubrication_interval("deep-groove", 100, 20_000)
    assert e.value.code == "relubrication_out_of_range"
    with pytest.raises(CalculationError) as e:
        relubrication_interval("toroidal", 50, 1000)
    assert e.value.code == "relubrication_unsupported"
