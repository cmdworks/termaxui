use crate::cell::{CellAttributes, CellFlags};
use crate::color::Color;

pub fn handle_sgr<I>(params: &mut I, attr: &mut CellAttributes)
where
    I: Iterator<Item = u16>,
{
    while let Some(param) = params.next() {
        match param {
            0 => attr.reset(),
            1 => attr.flags.insert(CellFlags::BOLD),
            2 => attr.flags.insert(CellFlags::DIM),
            3 => attr.flags.insert(CellFlags::ITALIC),
            4 => attr.flags.insert(CellFlags::UNDERLINE),
            5 | 6 => attr.flags.insert(CellFlags::BLINK),
            7 => attr.flags.insert(CellFlags::INVERSE),
            8 => attr.flags.insert(CellFlags::HIDDEN),
            9 => attr.flags.insert(CellFlags::STRIKETHROUGH),
            22 => {
                attr.flags.remove(CellFlags::BOLD);
                attr.flags.remove(CellFlags::DIM);
            }
            23 => attr.flags.remove(CellFlags::ITALIC),
            24 => attr.flags.remove(CellFlags::UNDERLINE),
            25 => attr.flags.remove(CellFlags::BLINK),
            27 => attr.flags.remove(CellFlags::INVERSE),
            28 => attr.flags.remove(CellFlags::HIDDEN),
            29 => attr.flags.remove(CellFlags::STRIKETHROUGH),
            30..=37 => attr.fg = Color::Indexed((param - 30) as u8),
            38 => {
                if let Some(color) = parse_extended_color(params) {
                    attr.fg = color;
                }
            }
            39 => attr.fg = Color::Default,
            40..=47 => attr.bg = Color::Indexed((param - 40) as u8),
            48 => {
                if let Some(color) = parse_extended_color(params) {
                    attr.bg = color;
                }
            }
            49 => attr.bg = Color::Default,
            90..=97 => attr.fg = Color::Indexed((param - 90 + 8) as u8),
            100..=107 => attr.bg = Color::Indexed((param - 100 + 8) as u8),
            _ => {}
        }
    }
}

fn parse_extended_color<I: Iterator<Item = u16>>(params: &mut I) -> Option<Color> {
    match params.next()? {
        5 => {
            // 256 color index: 38;5;idx
            let idx = params.next()?;
            Some(Color::Indexed((idx & 0xFF) as u8))
        }
        2 => {
            // 24-bit TrueColor: 38;2;r;g;b
            let r = params.next()?;
            let g = params.next()?;
            let b = params.next()?;
            Some(Color::Rgb(
                (r & 0xFF) as u8,
                (g & 0xFF) as u8,
                (b & 0xFF) as u8,
            ))
        }
        _ => None,
    }
}
