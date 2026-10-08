import { Button, Icon, Row, useTheme } from '@umami/react-zen';
import { Moon, Sun } from '@/components/icons';
import { persistTpcTheme } from '@/lib/tpc-theme';

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();

  return (
    <Row gap>
      <Button
        variant={theme === 'light' ? 'primary' : undefined}
        onPress={() => {
          setTheme('light');
          persistTpcTheme('light');
        }}
      >
        <Icon>
          <Sun />
        </Icon>
      </Button>
      <Button
        variant={theme === 'dark' ? 'primary' : undefined}
        onPress={() => {
          setTheme('dark');
          persistTpcTheme('dark');
        }}
      >
        <Icon>
          <Moon />
        </Icon>
      </Button>
    </Row>
  );
}
