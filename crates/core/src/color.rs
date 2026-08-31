#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Default)]
pub enum Color {
    #[default]
    Default,
    Indexed(u8),
    Rgb(u8, u8, u8),
}
