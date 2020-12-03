package com.notepad.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.notepad.entity.Item;
import com.notepad.entity.Menu;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

	List<Item> findAllByMenu(Menu menu);

//	List<Item> findAllByMenuOrderByzIndex(Menu menu);
	
//	List<Item> findAllByMenuOrderByZIndex(Menu menu);

	List<Item> findAllByMenuOrderByZindex(Menu menu);

	//List<Item> findAllByMenuId(Long menuId);

}
