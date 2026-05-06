/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Button from '@mui/material/Button';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OauthPopup from './OauthPopup';

describe('OauthPopup', () => {
  const originalWindowOpen = window.open;

  afterEach(() => {
    window.open = originalWindowOpen;
    vi.restoreAllMocks();
  });

  function setup() {
    let beforeUnloadListener: (() => void) | undefined;
    const popupWindow = {
      addEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === 'beforeunload') {
          beforeUnloadListener = listener;
        }
      }),
      close: vi.fn(),
    };

    window.open = vi.fn(() => popupWindow as unknown as Window);

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const view = render(
      <OauthPopup button={Button} onCode={vi.fn()} title="Auth" url="https://example.com/auth">
        Sign in
      </OauthPopup>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    const storageListener = addEventListenerSpy.mock.calls.find(call => call[0] === 'storage')?.[1];

    return {
      beforeUnload: () => beforeUnloadListener?.(),
      popupWindow,
      removeEventListenerSpy,
      storageListener,
      ...view,
    };
  }

  it('removes storage listener when popup is closed without auth', () => {
    const { beforeUnload, removeEventListenerSpy, storageListener } = setup();

    beforeUnload();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', storageListener);
  });

  it('removes storage listener when component unmounts', () => {
    const { popupWindow, removeEventListenerSpy, storageListener, unmount } = setup();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', storageListener);
    expect(popupWindow.close).toHaveBeenCalled();
  });
});
