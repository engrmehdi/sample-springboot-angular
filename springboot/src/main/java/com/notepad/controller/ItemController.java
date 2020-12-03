package com.notepad.controller;

import java.net.URISyntaxException;
import java.security.Principal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.notepad.dto.ItemDTO;
import com.notepad.entity.Item;
import com.notepad.service.ItemService;

/**
 * REST controller for managing {@link Item}
 */
@RestController
//@RequestMapping("/api")
@CrossOrigin
public class ItemController {

	private final Logger log = LoggerFactory.getLogger(ItemController.class);

	@Autowired
	private ItemService itemService;
	
	/**
     * {@code POST  /api/menu/addItem} : Create a new item
     *
     * @param itemDTO : the itemDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new itemDTO.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
	@PostMapping("/api/menu/addItem")
	public ResponseEntity<ItemDTO> saveItem(@RequestBody ItemDTO itemDTO, Principal principal) {
		log.info("Rest request to save Item: {}", itemDTO);
		return ResponseEntity.ok().body(itemService.save(itemDTO, principal));
	}
	
	/**
     * {@code PUT  /api/menu/updateItem} : Updates an existing item.
     *
     * @param itemDTO the itemDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated itemDTO,
     * or with status {@code 400 (Bad Request)} if the itemDTO is not valid,
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
	@PutMapping("/api/menu/updateItem")
	public ResponseEntity<ItemDTO> updateItem(@RequestBody ItemDTO itemDTO, Principal principal) {
		log.info("Rest request to update Item: {}", itemDTO);
		if(itemDTO.getItemId() == null) {
			throw new BadCredentialsException("itemId should not be null");
		}
		return ResponseEntity.ok().body(itemService.save(itemDTO, principal));
	}
	
	/**
     * {@code GET  /api/menu/menuItem/{menuId}} : get all the items by menuId.
     * @param menuId to get all the items inside this "menuId" menu
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of menus in body.
     */
	@GetMapping("/api/menu/menuItem/{menuId}")
	public ResponseEntity<List<ItemDTO>> getAllItemsByMenu(@PathVariable Long menuId) {
		log.info("Rest request to get all Items from menu with menuId : {}", menuId);
		List<ItemDTO> itemDTOs = itemService.findAllByMenu(menuId);
		return ResponseEntity.ok().body(itemDTOs);
	}
	
	/**
     * {@code DELETE  /api/menu/delItem/:itemId} : delete the "id" item.
     *
     * @param itemId the id of the item to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
	@DeleteMapping("/api/menu/delItem/{itemId}")
	public ResponseEntity<String> deleteItem(@PathVariable Long itemId) {
		log.info("Rest request to delete Item with id: {}", itemId);
		itemService.delete(itemId);
		return ResponseEntity.noContent().build();
	}
	
}
